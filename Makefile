.PHONY: test-apple
test-apple:
	./node_modules/mocha/bin/mocha test/apple.js -R spec -b --path=$(path)

.PHONY: test-google
test-google:
	./node_modules/mocha/bin/mocha test/google.js -R spec -b --path=$(path) --pk=$(pk)

.PHONY: test-windows
test-windows:
	./node_modules/mocha/bin/mocha test/windows.js -R spec -b --path=$(path)
