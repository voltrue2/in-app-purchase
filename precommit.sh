#!/bin/sh

`echo ./lint.sh`;

exitCode=$?;

if [[ $exitCode != 0 ]]; then
        exit 1;
fi

`echo make test`;
