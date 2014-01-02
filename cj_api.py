#!/usr/bin/python

'''
Licensed under GLPv3 (subject to change).
Copyright: Max Kaye; Leo Treasure
'''

# config
logfilename = 'cj_api.log'
dbnum = 0
#dbprefix = 'cj_api'
dbprefix = 'cj_api_test'

# import and init
from flask import Flask
from flask import request, redirect
app = Flask(__name__)

import logging
log_handler = logging.FileHandler(logfilename)
log_handler.setLevel(logging.WARNING)
app.logger.addHandler(log_handler)

from Crypto.Hash import SHA256
import json, copy

### LOAD CONFIG

logfilename = 'cj_api.log'
dbnum = 0
#dbprefix = 'cj_api'
dbprefix = 'cj_api_test'

### END LOAD CONFIG

# helpers
def sha256Hash(plaintext):
	h = SHA256.new()
	h.update(plaintext)
	return h.digest()
	
def attribNameToIndex(attribName):
	return 'index'+attribName[0].upper()+attribName[1:]
	
### CLASSES

# database
class Database:
	def __init__(self):
		import redis
		self.r = redis.StrictRedis(host='localhost', port=6379, db=dbnum)
		self.dbprefix = dbprefix
	# redis primatives
	def pre(self):
		return self.dbprefix
	def exists(self,loc):
		return self.r.exists(loc)
	def set(self,loc,value):
		return self.r.set(loc,value)
	def get(self,loc):
		return self.r.get(loc)
	def lrange(self,loc,start,end):
		return self.r.lrange(loc,start,end)
	def lget(self,loc):
		return self.lrange(loc,0,-1)
	def rpush(self,loc,*value):
		return self.r.rpush(loc,*value)
	def sadd(self,loc,*value):
		return self.r.sadd(loc,*value)
	def smembers(self,loc):
		return self.r.smembers(loc)
	def delete(self,loc):
		return self.r.delete(loc)
	# Complex Operations
	def dump(self, pathToDump): # THIS IS UNTESTED - TEST!!!!
		ans = {}
		attribPath = '%s:attribs' % pathToDump
		if self.exists(attribPath):
			setOfAttribs = self.smembers(attribPath)
			for attrib in setOfAttribs:
				if attrib[0] == '{' and attrib[-1] == '}':
					attribName = attrib[1:-1]
					iName = attribNameToIndex(attribName)
					index = self.smembers('%s:%s' % (pathToDump, iName))
					print index
					for n in index:
						ans[n] = self.dump('%s:%s' % (pathToDump,n))
				else:
					ans[attrib] = self.dump('%s:%s' % (pathToDump,attrib))
			return ans
		else:
			return self.get(pathToDump)
	def getMenu(self):
		menu = {}
		menu['groups'] = self.dump('%s:groups' % dbprefix)
		menu['items'] = self.dump('%s:items' % dbprefix)
		return menu
	
class DBNode:
	def __init__(self, typeOfNode, name, valType=None, parent=None):
		assert typeOfNode in ['static','variable','value'] # either it's a static name with subkeys, a variable name with subkeys, or holds some value (list/set/string/etc)
		if parent == None: assert typeOfNode == 'static' # the only node without a parent is the first one and must be static
		assert valType in [None,'list','set','string']
		assert ((typeOfNode == 'value') and (valType != None)) or (typeOfNode != 'value')
		self.children = set()
		self.value = ""
		self.name = name
		self.typeOfNode = typeOfNode
		self.attribs = {}
		self.parent = parent
		self.valType = valType
		self.aamc = self.addAndMakeChild
		self.db = None
		self.subvar = None # this points to the name of the variable of a child; there can only be one variable for each child otherwise they might collide
				
		if self.parent != None:
			self.db = self.parent.db
		
		if self.typeOfNode == 'variable':
			self.parent.addAndMakeChild('value',self.myIndex(),valType='set')
			self.parent.subvar = self.name
			
	def setDb(self, db):
		self.db = db
		
	def myIndex(self):
		if self.typeOfNode != 'variable':
			raise Exception('only variable names have indexes')
		return attribNameToIndex(self.name)
		
	def hasChildNamed(self, childName):
		for child in self.children:
			if child.name == childName:
				return True
		return False
	
	def addChild(self, childNode):
		if self.typeOfNode == 'value':
			raise Exception('Nodes of type "value" cannot have children')
		if childNode not in self.children:
			self.children.add(childNode)
			self.attribs[childNode.name] = childNode
			childNode.parent = self
			
	def updateAttribs(self, **kwargs):
		self.updateIndex(**kwargs)
		if self.typeOfNode != 'value':
			attribs = set()
			hasAttribs = False
			for child in self.children:
				if child.name == 'attribs':
					hasAttribs = True
					continue
				if child.name[:5] == 'index':
					continue
				if child.typeOfNode == 'variable':
					attribs.add('{%s}' % child.name)
				else:
					attribs.add(child.name)
			if not hasAttribs:
				self.aamc('value','attribs',valType='set')
			print attribs
			self['attribs'].add(False, *attribs, **kwargs)		
		if self.parent != None:
			self.parent.updateAttribs(**self.removeSelfFromKwargs(kwargs))
			
	def updateIndex(self, **kwargs):
		if self.typeOfNode == 'variable':
			print kwargs
			possibleNewVariable = kwargs[self.name]
			self.parent[self.myIndex()].add(False,possibleNewVariable,**self.removeSelfFromKwargs(kwargs))
		
	def removeSelfFromKwargs(self, kwargs):
		newKwargs = copy.copy(kwargs)
		if self.name in kwargs.keys():
			del newKwargs[self.name]
		return newKwargs
			
	def addAndMakeChild(self, typeOfNode, name, valType=None):
		self.addChild(DBNode(typeOfNode, name, valType=valType, parent=self))
	
	def getChildWithName(self, name):
		for c in self.children:
			if c.name == name:
				return c
		raise KeyError('No child named %s' % name)
		
	def printAll(self, subLevel=-1):
		toPrint = ''
		if subLevel == -1:
			toPrint = self.name
		else:
			for sl in range(subLevel):
				toPrint += '|'
			toPrint += '-' 
			template = '%s'
			if self.typeOfNode == 'variable':
				template = '{%s}'
			toPrint += template % self.name
		print toPrint, '\t\t', self.getFullPath()
		listOfChildren = self.attribs.keys()
		listOfChildren.sort()
		for cn in listOfChildren:
			self.attribs[cn].printAll(subLevel=subLevel+1)
			
	def getAllVariables(self):
		toRet = []
		if self.parent == None:
			return toRet
		if self.typeOfNode == 'variable':
			toRet = [self.name]
		return self.parent.getAllVariables() + toRet
			
	def getPathList(self):
		toRet = [self.name]
		if self.parent == None:
			return toRet
		if self.typeOfNode == 'variable':
			toRet = ['{'+self.name+'}']
		return self.parent.getPathList() + toRet
			
	def getFullPath(self):
		return ':'.join(self.getPathList())
			
	def add(self,updateAttribs=True,*addThis, **kwargs):
		self.genericOp(self.db.sadd, 'set', updateAttribs, *addThis, **kwargs)
		
	def append(self,updateAttribs=True,*appendThis, **kwargs):
		self.genericOp(self.db.rpush, 'list', updateAttribs, *appendThis, **kwargs)
		
	def delete(self, updateAttribs=True, **kwargs):
		self.genericOp(self.db.delete, None, updateAttribs, **kwargs)
		
	def set(self, setTo, updateAttribs=True, **kwargs):
		self.genericOp(self.db.set, 'string', updateAttribs, setTo, **kwargs)
		
	def genericOp(self, op, valType, updateAttribs=True, *val, **kwargs):
		if self.typeOfNode != 'value' or (self.valType != valType and valType != None):
			raise Exception('Wrong type of node')
		self._checkKwargs(kwargs, updateAttribs=updateAttribs)
		if val != ():
			op(self.getFullPath().format(**kwargs), *val)
		elif op in [self.db.delete]:
			op(self.getFullPath().format(**kwargs))
			
	def getExpectedKwargs(self):
		allVars = set(self.getAllVariables())
		return allVars
			
	def _checkKwargs(self, kwargs, updateAttribs=True):
		allVars =self.getExpectedKwargs()
		kwargVars = set(kwargs.keys())
		if allVars == kwargVars:
			print 'checkin'
			if updateAttribs:
				self.updateAttribs(**kwargs)
			return True
		raise KeyError('Incorrect kwargs provided: recieved %s, wanted %s', (kwargVars, allVars))
	
	def __getitem__(self, key):
		return self.attribs[key]
	
	def __setitem__(self, name, node):
		if not isinstance(node,DBNode):
			raise ValueError('only DBNodes may be subchildren of DBNodes')
		if name != node.name:
			raise KeyError('name %s does not match node.name %s' % (name, node.name))
		self.children.add(node)

### DATABASE SETUP

db = Database()
dbs = DBNode('static',dbprefix)
dbs.setDb(db)
dbs.aamc('static','groups')
dbs['groups'].aamc('variable','name')
dbs['groups']['name'].aamc('value','class','string')
dbs['groups']['name'].aamc('static','options')
dbs['groups']['name']['options'].aamc('variable','optionName')
dbs['groups']['name']['options']['optionName'].aamc('value','optionType','string')
dbs['groups']['name']['options']['optionName'].aamc('value','listOfOptions','list')
dbs['groups']['name']['options']['optionName'].aamc('value','default','string')
dbs.aamc('static','items')
dbs['items'].aamc('variable','class') # first level of classification
dbs['items']['class'].aamc('variable','name')
dbs['items']['class']['name'].aamc('value','description','string')
dbs['items']['class']['name'].aamc('value','group','string')
dbs['items']['class']['name'].aamc('value','basePrice','string')
dbs.aamc('static','invoices')
dbs['invoices'].aamc('variable','id')
dbs['invoices']['id'].aamc('value','network','string')
dbs['invoices']['id'].aamc('value','totalAmount','string')
dbs['invoices']['id'].aamc('value','confirmed','string')
dbs['invoices']['id'].aamc('value','orderDetails','string')
dbs.aamc('static','meta')
dbs['meta'].aamc('value','version','string')
dbs.aamc('static','config')
dbs['config'].aamc('variable','network')
dbs['config']['network'].aamc('value','hostport','string')
dbs['config']['network'].aamc('value','username','string')
dbs['config']['network'].aamc('value','password','string')
dbs['config']['network'].aamc('value','xpub','string')
dbs['config']['network'].aamc('value','rate','string') # conversion rate aud/btc

### END DATABASE SETUP

dbs.printAll()

def initSetValues(lastNode, submenu, **kwargs):
	if isinstance(submenu,dict):
		# then we dig deeper
		for key in submenu.keys():
			print key
			if lastNode.hasChildNamed(key):
				initSetValues(lastNode[key], submenu[key], **kwargs)
			else:
				# must be a variable
				name = lastNode.subvar
				print key, 'name', name
				kwargs[name] = key
				initSetValues(lastNode[name], submenu[key], **kwargs)
	else:
		# we need to set something:
		if isinstance(submenu, list):
			#lastNode.delete(**kwargs)
			lastNode.append(submenu,**kwargs)
			print "append", lastNode.getFullPath().format(**kwargs), submenu
		elif isinstance(submenu, str) or isinstance(submenu,unicode):
			lastNode.set(submenu,**kwargs)
			print "set", lastNode.getFullPath().format(**kwargs), submenu

def loadInitialMenu():
	initMenu = "sample.menu"
	with open(initMenu, 'r') as f:
		menu = json.load(f)
	initSetValues(dbs, menu)

# routes
@app.route("/api/get/menu")
def get_menu():
	menu = db.getMenu()
	return json.dumps(menu)


if __name__ == "__main__":
	loadInitialMenu()
	print json.dumps(db.getMenu(), indent=4)
	app.run()
