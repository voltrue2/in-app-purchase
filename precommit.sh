#!/bin/sh

rootDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
jschanged=`${rootDir}/scripts/detect_js_change`;

if [ $jschanged -eq 1 ]; then
    echo "javascript files have been changed";
    `echo ./bin/lint index.js lib/`;
    exitCode=$?;
    if [[ $exitCode != 0 ]]; then
            exit 1;
    fi
    `echo make test`;
else
    echo "No javascript has been changed: skip lint and tests";
fi
