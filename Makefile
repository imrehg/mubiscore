EXTENSIONNAME = mubiscore
FILES = manifest.json LICENSE browser-polyfill.js contentScript.js content.css options.js options.html icons/
VERSION = $(shell jq -r .version manifest.json)
TARGET = $(EXTENSIONNAME)-$(VERSION).zip

zip:
	-rm -f $(TARGET)
	zip $(TARGET) -qr 9 -X $(FILES)
