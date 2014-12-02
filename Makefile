init:
	@echo 'create git pre-commit hook'
	ln -s ../../lint.sh .git/hooks/pre-commit
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'install dependencies'
	npm install
	@echo 'done'

.PHONY: test-apple
test-apple:
	./node_modules/mocha/bin/mocha test/apple.js -R spec -b --timeout=5000 --path=$(path)

.PHONY: test-google
test-google:
	./node_modules/mocha/bin/mocha test/google.js -R spec -b --path=$(path) --pk=$(pk)

.PHONY: test-windows
test-windows:
	./node_modules/mocha/bin/mocha test/windows.js -R spec -b --timeout=5000 --path=$(path)
