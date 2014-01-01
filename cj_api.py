#!/usr/bin/python

'''
Licensed under GLPv3 (subject to change).
Copyright: Max Kaye; Leo Treasure
'''

# config
logfilename = 'cj_api.log'
dbnum = 0
#dbPre = 'cj_api'
dbPre = 'cj_api_test'

# import and init
from flask import Flask
from flask import request, redirect
app = Flask(__name__)

import logging
log_handler = logging.FileHandler(logfilename)
log_handler.setLevel(logging.WARNING)
app.logger.addHandler(log_handler)

from Crypto.Hash import SHA256
import json

# helpers
def sha256Hash(plaintext):
	h = SHA256.new()
	h.update(plaintext)
	return h.digest()
	
def attribNameToIndex(attribName):
	return 'index'+attribName[0].upper()+attribName[1:]
	
class DBNode:
	def __init__(self, typeOfNode, name, valType=None, parent=None):
		assert typeOfNode in ['static','variable','value'] # either it's a static name with subkeys, a variable name with subkeys, or holds some value (list/set/string/etc)
		if parent == None: assert typeOfNode == 'static' # the only node without a parent is the first one and must be static\
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
		
		if self.typeOfNode == 'variable':
			self.parent.addAndMakeChild('value',attribNameToIndex(self.name),valType='list')
		
	def addChild(self, childNode):
		if childNode not in self.children:
			self.children.add(childNode)
			self.attribs[childNode.name] = childNode
			childNode.parent = self
			
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
				template = '<%s>'
			toPrint += template % self.name
		print toPrint
		listOfChildren = self.attribs.keys()
		listOfChildren.sort()
		for cn in listOfChildren:
			self.attribs[cn].printAll(subLevel=subLevel+1)
	
	def __getitem__(self, key):
		return self.attribs[key]
	
	def __setitem__(self, name, node):
		if not isinstance(node,DBNode):
			raise ValueError('only DBNodes may be subchildren of DBNodes')
		if name != node.name:
			raise KeyError('name %s does not match node.name %s' % (name, node.name))
		self.children.add(node)

dbs = DBNode('static','cj')
dbs.aamc('static','groups')
dbs['groups'].aamc('variable','name')
dbs['groups']['name'].aamc('value','class','string')
dbs['groups']['name'].aamc('static','options')
dbs['groups']['name']['options'].aamc('variable','optionName')
dbs['groups']['name']['options']['optionName'].aamc('value','optionType','string')
dbs['groups']['name']['options']['optionName'].aamc('value','listOfOptions','list')
dbs['groups']['name']['options']['optionName'].aamc('value','default','string')
dbs.aamc('static','items')
dbs['items'].aamc('variable','class')
dbs['items']['class'].aamc('variable','name')
dbs['items']['class']['name'].aamc('value','description','string')
dbs['items']['class']['name'].aamc('value','group','string')
dbs['items']['class']['name'].aamc('value','price','string')
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
#dbs.printAll()

# database
class Database:
	def __init__(self):
		import redis
		self.r = redis.StrictRedis(host='localhost', port=6379, db=dbnum)
		self.dbPre = dbPre
	# redis primatives
	def pre(self):
		return self.dbPre
	def exists(self,toTest):
		return self.r.exists('%s:%s' % (self.dbPre,toTest))
	def set(self,toSet,value):
		return self.r.set('%s:%s' % (self.dbPre,toSet),value)
	def get(self,toGet):
		return self.r.get('%s:%s' % (self.dbPre,toGet))
	def rpush(self,toPush, value):
		return self.r.rpush('%s:%s' % (self.dbPre,toPush), value)
	# Complex Operations
	def dump(self, pathToDump): # THIS IS UNTESTED - TEST!!!!
		ans = {}
		attribPath = '%s:attribs' % pathToDump
		if self.exists(attribPath):
			listOfAttribs = self.get(attribPath)
			for attrib in listOfAttribs:
				if attrib[0] == '<' and attrib[-1] == '>':
					attribName = attrib[1:-1]
					iName = attribNameToIndex(attribName)
					index = self.get('%s:%s' % (pathToDump, iName))
					for n in index:
						ans[n] = self.dump('%s:%s' % (pathToDump,n))
				else:
					ans[attrib] = self.dump('%s:%s' % (pathToDump,attrib))
		else:
			return self.get(pathToDump)
	def getMenu(self):
		menu = {}
		menu['groups'] = self.dump('groups')
		menu['items'] = self.dump('items')
		return menu


# routes
@app.route("/api/get/menu")
def get_menu():
	menu = db.getMenu()
	return json.dumps(menu)


if __name__ == "__main__":
	db = Database()
	app.run()
