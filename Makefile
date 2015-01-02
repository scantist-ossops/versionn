DATE ?= $(shell date +%Y-%m-%d)
VERSION ?= $(shell cat VERSION)

files = versionn.1

all: update $(files)

update:
	bin/versionn.js --same VERSION package.json bin/versionn.js

versionn.1:
	@sed 's/\(\.TH versionn 1 \).*\( \"versionn\.js\"\)/\1\"$(DATE)\" \"v$(VERSION)\"\2/' ./man/versionn.1 > ./man/x && mv ./man/x ./man/versionn.1

clean:

.PHONY: all clean
