var manifest       = require('./manifest.json');
var gulp           = require('gulp');
var noComments     = require('gulp-strip-comments');
var noHTMLComments = require('gulp-remove-html-comments');
var noEmptyLines   = require('gulp-remove-empty-lines');
var removeFiles    = require('gulp-clean');
var replace        = require('gulp-replace');
var minifyCSS      = require('gulp-minify-css');
var removeLines    = require('gulp-delete-lines');
var rename         = require('gulp-rename');
var uglify         = require('gulp-uglify');
var zip            = require('gulp-zip');

var build_dir      = '@build/' + manifest.version + '/';



// zip extension

gulp.task('zip_it', function() {

	function zip_this_shit() {

		gulp.src(build_dir + '**')
				.pipe(zip('FoxyTabs_v' + manifest.version + '.zip'))
				.pipe(gulp.dest(build_dir));

	}
	setTimeout(zip_this_shit, 5000)

});



// do stuff

gulp.task('do_stuff', function() {

	// locales
	// remove comments
	// remove empty lines
	// copy

	gulp.src('_locales/**')
			.pipe(noComments())
			.pipe(noEmptyLines())
			.pipe(gulp.dest(build_dir + '_locales'));

	// fonts
	// only *.woff
	// only *.woff2
	// copy

	gulp.src(['font/*.woff', 'font/*.woff2'])
			.pipe(gulp.dest(build_dir + 'font'));

	// imgs
	// only *.svg and *.png
	// copy

	gulp.src(['img/**/*.svg', 'img/**/*.png'])
			.pipe(gulp.dest(build_dir + 'img'));

	// js
	// only minified
	// exclude vanilla.min.js
	// copy

	gulp.src(['js/**.min.js', '!js/popup.vanilla.min.js'])
			.pipe(gulp.dest(build_dir + 'js'));

	// main.js
	// minify
	// copy

	gulp.src('js/main.js')
			.pipe(uglify())
			.pipe(rename('main.min.js'))
			.pipe(gulp.dest(build_dir + 'js'));

	// popup.js
	// minify
	// copy

	gulp.src('js/popup.js')
			.pipe(uglify())
			.pipe(rename('popup.min.js'))
			.pipe(gulp.dest(build_dir + 'js'));

	// css
	// all *.min.css
	// all compiled/*.css
	// all images/*.png
	// copy

	gulp.src('less/*.min.css')
			.pipe(gulp.dest(build_dir + 'less'));

	gulp.src('less/compiled/*.css')
			.pipe(gulp.dest(build_dir + 'less/compiled'));

	gulp.src('less/images/**.png')
			.pipe(gulp.dest(build_dir + 'less/images'));

	// popup.css
	// minify
	// copy

	gulp.src('less/popup.css')
			.pipe(minifyCSS())
			.pipe(rename('popup.min.css'))
			.pipe(gulp.dest(build_dir + 'less'));

	// fontello.css
	// remove not woff links
	// minify
	// copy

	gulp.src('less/fontello.css')
			.pipe(removeLines({'filters': [ /fontello.eot/g ]}))
			.pipe(removeLines({'filters': [ /fontello.ttf/g ]}))
			.pipe(removeLines({'filters': [ /fontello.svg/g ]}))
			.pipe(replace('url(', 'src: url('))
			.pipe(replace('),', ');'))
			.pipe(minifyCSS())
			.pipe(rename('fontello.min.css'))
			.pipe(gulp.dest(build_dir + 'less'));

	// views
	// exclude popup.html
	// copy

	gulp.src(['views/*','!views/popup.html'])
			.pipe(gulp.dest(build_dir + 'views'));

	// popup.html
	// change js and css links to minified
	// copy

	gulp.src('views/popup.html')
			.pipe(replace('js/popup.js'      , 'js/popup.min.js'      ))
			.pipe(replace('less/fontello.css', 'less/fontello.min.css'))
			.pipe(replace('less/popup.css'   , 'less/popup.min.css'   ))
			.pipe(gulp.dest(build_dir + 'views'));

	// root directory json files
	// exclude logos.json
	// copy

	gulp.src(['*.json','!logos.json'])
			.pipe(gulp.dest(build_dir));

	// logos.json
	// remove (empty) lines containing ":"",

	gulp.src('logos.json')
			.pipe(removeLines({'filters': [/":""/g]}))
			.pipe(gulp.dest(build_dir));

	// index.html
	// change js and css links to minified
	// remove comments
	// remove link to all images
	// copy

	gulp.src('index.html')
			.pipe(replace('js/main.js'       , 'js/main.min.js'       ))
			.pipe(replace('less/fontello.css', 'less/fontello.min.css'))
			.pipe(noHTMLComments())
			.pipe(removeLines({'filters': ['show_all_default_images']}))
			.pipe(gulp.dest(build_dir));

});



// run

gulp.task('default', ['do_stuff', 'zip_it']);
