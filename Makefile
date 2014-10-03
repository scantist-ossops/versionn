DATE ?= $(shell date +%Y-%m-%d)
VERSION ?= $(shell cat VERSION)
INC = "--patch"

files = versionn.1

all: increment $(files)

increment:
	bin/versionn.js $(INC) VERSION package.json bin/versionn.js

versionn.1:
	@sed 's/\(\.TH versionn 1 \).*\( \"versionn\.js\"\)/\1\"$(DATE)\" \"v$(VERSION)\"\2/' ./man/versionn.1 > ./man/x && mv ./man/x ./man/versionn.1

clean: 

.PHONY: all clean
