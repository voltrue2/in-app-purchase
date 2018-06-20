#!/bin/sh

`echo ./bin/lint index.js lib/`;

exitCode=$?;

if [[ $exitCode != 0 ]]; then
        exit 1;
fi

`echo make test`;
