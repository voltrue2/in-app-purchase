init:
	@echo 'create git pre-commit hook'
	ln -s ../../precommit.sh .git/hooks/pre-commit
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'install dependencies'
	npm install
	@echo 'done'

.PHONY: lint
lint:
	./lint.sh

.PHONY: test
test:
	./node_modules/mocha/bin/mocha test/apple.js -R spec -b --timeout=5000 --path=false
	./node_modules/mocha/bin/mocha test/google.js -R spec -b --path=false --pk=false
	./node_modules/mocha/bin/mocha test/amazon.js -R spec -b --timeout=5000 --sharedKey=false --path=false
	./node_modules/mocha/bin/mocha test/windows.js -R spec -b --timeout=5000 --path=false

.PHONY: aptest
aptest:
	./node_modules/mocha/bin/mocha test/apple.js -R spec -b --timeout=5000 --path=false

.PHONY: gotest
gotest:
	./node_modules/mocha/bin/mocha test/google.js -R spec -b --path=false --pk=false

.PHONY: amtest
amtest:
	./node_modules/mocha/bin/mocha test/amazon.js -R spec -b --timeout=5000 --sharedKey=false --path=false	

.PHONY: witest
witest:
	./node_modules/mocha/bin/mocha test/windows.js -R spec -b --timeout=5000 --path=false

.PHONY: test-apple
test-apple:
	./node_modules/mocha/bin/mocha test/apple.js -R spec -b --timeout=5000 --path=$(path)

.PHONY: test-google
test-google:
	./node_modules/mocha/bin/mocha test/google.js -R spec -b --path=$(path) --pk=$(pk)

.PHONY: test-windows
test-windows:
	./node_modules/mocha/bin/mocha test/windows.js -R spec -b --timeout=5000 --path=$(path)

.PHONY: test-amazon
test-amazon:
	./node_modules/mocha/bin/mocha test/amazon.js -R spec -b --timeout=5000 --sharedKey=$(sharedKey) --path=$(path)
