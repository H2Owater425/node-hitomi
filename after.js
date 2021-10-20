const browserify = require('browserify');
const { minify } = require('terser');
const { join } = require('path');
const { writeFile, readFile } = require('fs/promises');

function errorHandler(..._arguments) {
	console.error(_arguments);

	process.exit(1);
}

readFile('./library/index.js', { encoding: 'utf-8', flag: 'r' }).then(function (code) {
	minify(code).then(function (result) {
		if(typeof(result['code']) !== 'undefined') {
			writeFile('./library/index.js', result['code'], { encoding: 'utf-8', flag: 'w' }).then(function () {
				browserify(join(__dirname, './library/index.js'), { standalone: 'hitomi' }).bundle(function (error, buffer) {
					if(error === null) {
						minify(buffer.toString('utf-8')).then(function (result) {
							if(typeof(result['code']) !== 'undefined') {
								result['code'] = '"use strict";' + result['code'].replace(/"use strict";|\n/g, '');

								writeFile('./library/browser.js', result['code'], { encoding: 'utf-8', flag: 'w' }).then(function () {
									console.log('Successfully finished (browser | min)ifying');

									return;
								})
								.catch(errorHandler);
							} else {
								errorHandler('Cannot minify browser.js');
							}
					
							return;
						})
						.catch(errorHandler);
					} else {
						errorHandler('Cannot browserify index.js')
					}
				
					return;
				});
				
				return;
			})
			.catch(errorHandler);
		} else {
			errorHandler('Cannot minify index.js');
		}

		return;
	})
	.catch(errorHandler);
			
	return;
})
.catch(errorHandler);