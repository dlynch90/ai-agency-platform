#!/bin/bash

# Test script to reproduce and debug the template validation issue

echo "🐛 Testing template validation issue..."

# Clear any previous debug logs
rm -f ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log

# Test 1: Try to run Maven directly on the template (this should fail)
echo "🧪 Test 1: Running Maven on template directory (should fail)"
cd java-templates/spring-boot
if mvn validate -q 2>&1; then
    echo "❌ Unexpected success - template should not validate"
else
    echo "✅ Expected failure - template contains placeholders"
fi

# Test 2: Create a new project using the Makefile
echo "🧪 Test 2: Creating project from template using Makefile"
cd ../..
echo -e "test-project\nA test Spring Boot project\n" | make -f Makefile.java java-new-spring-boot

# Test 3: Validate the created project
echo "🧪 Test 3: Validating created project"
if [ -d "test-project" ]; then
    cd test-project
    if mvn validate -q; then
        echo "✅ Project validates successfully"
    else
        echo "❌ Project validation failed"
    fi
    cd ..
else
    echo "❌ Project directory was not created"
fi

# Clean up
rm -rf test-project

echo "🔍 Debug complete"