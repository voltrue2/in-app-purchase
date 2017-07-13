#!/bin/sh

###################
# variables
###################

# You can customize the jshint location using the JSHINT variable.
# e.g. JSHINT=./node_modules/.bin/jshint scripts/lint/lint.sh
# if you want to use a local version of jshint.
if [ -z "$JSHINT" ]; then
	JSHINT="jshint"
fi
name="in-app-purchase";
cwd=`pwd`;
# list directories/files to lint
list=();
defaultDirList="index.js lib/";
# optional space separated list of directories/files to lint
# Example: ./lint.sh "mydir/ myFile" > this will lint all files in mydir/ and lint myFile
dirList=$1;

##################
# functions
##################

indexOf() {
	pos="${1%%$2*}";
	[[ $pos = $1 ]] && echo -1 || echo ${#pos};
}

echoGreen() {
	echo -en '\E[32m'"\033[1m`checkMark` $1\033[0m\n\r";
}

echoYellow() {
	echo -en '\E[33m'"\033[1m$1\033[0m\n\r";
}

echoBlue() {
	echo -en '\E[34m'"\033[1m`mark` $1\033[0m\n\r";
}

echoRed() {
	echo -en '\E[31m'"\033[1m`errorMark` $1\033[0m\n\r";
}

arrowMark() {
	echo -e "\xe2\x86\x92";
}

checkMark() {
	echo -e "\xE2\x9C\x93";
}

errorMark() {
	echo -e "\xC7\x83";
}

mark() {
	echo -e "\xCB\x83 ";
}

# probably pointless...
lintTreeObj() {
	# lint the code to be commited
	if git rev-parse --verify HEAD >/dev/null 2>&1
	then
		against=HEAD;
	else
		# Initial commit: diff against an empty tree object
		against=4b825dc642cb6eb9a060e54bf8d69288fbee4904;
	fi

	toBeCommited=$(git diff --cached --name-only --diff-filter=ACM | grep ".js$");

	echoBlue "linting added files...";

	# lint JavaScript files only
	for file in ${toBeCommited}; do	
		echo "linting $path$file";
		failed=`$JSHINT "$path$file"`;
		if [ "$failed" ]; then
			echoRed "[error] line error(s) in $1";
			echoRed "$failed";
			exit 1;
		else
			echoGreen "Passed [OK]";
		fi
	done
}

lint() {
	# lint the code in the specified directories (this may not include added files to git)
	targetPath="$path$1";

	if [ -d "$targetPath" ] || [ -f "$targetPath" ]; then

		echo "linting $targetPath";

		failed=`$JSHINT "$targetPath"`;
		if [ "$failed" ]; then
			echoRed "[error] lint error(s) in $1";
			echoRed "$failed";
			exit 1;
		else
			echoGreen "Passed [OK]";
		fi
		
	else
		echoRed "[error] $targetPath";
		echoRed "No such file or directory ($targetPath)";
		exit 1;		
	fi
}

##########################
# procedural codes
##########################

# test if jshtin command is avialable
if ! type "$JSHINT" > /dev/null; then
	echoRed "[error] jshint command is not available";
	exit 1;
fi

# find root path
index=`indexOf "$cwd" "$name"`;
if [ "$index" -ne -1 ]; then
	path=`expr substr $cwd 1 $index`"$name/";
else 
	path="./";
fi 

echoBlue "Current working directory: $cwd";

echoBlue "Root path: $path";

# find directories/files to lint
if [ "$dirList" ]; then
	list=($dirList);
else
	list=($defaultDirList);
fi

echoYellow "directories/files to lint:";

for item in "${list[@]}"; do
	echoBlue "${item}";
done

# start linting
echoYellow "Executing jshint...";

# lint the files in git tree
#lintTreeObj "";

echoBlue "lint files in specified directories...";

# lint
for item in "${list[@]}"; do
	lint "${item}";
done

echoYellow "Done";

exit 0;
