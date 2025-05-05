#!/bin/bash
# Cleanup script for rails-goto-definition-extension

# Remove duplicate test files
rm -f test/unit/extension.coverage.js
rm -f test/unit/improved-coverage.js
rm -f test/unit/test-helper.js
rm -f test/unit/vscode.mock.js
rm -f test/unit/test-associations.js

# Remove duplicate/old documentation
rm -f DEVELOPMENT.md
rm -f DISTRIBUTION-GUIDE.md
rm -f EXTENSION-TESTING-GUIDE.md
rm -f TEST-GUIDE.md
rm -f TESTING-0.3.0-GUIDE.md
rm -f TESTING-GUIDE.md
rm -f test/manual-test-guide.md

# Remove generated/temporary files
rm -rf coverage/
rm -f extension.js.new
rm -f coverage-test.js

# Remove redundant samples
rm -rf test/sample/
rm -rf test/suite/

echo "Cleanup complete!"
