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
	
class Schema:
	def __init__(self, name):
		self.children = []
		self.name = name

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
		ans = []
		attribPath = '%s:attribs' % pathToDump
		if self.exists(attribPath):
			listOfAttribs = self.get(attribPath)
			for attrib in listOfAttribs:
				if attrib[0] == '<' and attrib[-1] == '>':
					attribName = attrib[1:-1]
					iName = 'index'+attribName[0].upper()+attribName[1:]
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

'''# routes
@app.route("/api/get/menu")
def get_menu():
	menu = db.getMenu()
	return json.dumps(menu)

@app.route("/",methods=["GET","POST"])
def main():
	if request.method == "POST":
		url = request.form['urlin']
		link = db.addSite('http://' + url)
		return render_template('result.html',url=url,link=link)
	return render_template('index.html')'''

if __name__ == "__main__":
	db = Database()
	app.run()