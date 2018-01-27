var keystone = require('keystone');
var async = require('async');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Init locals
	locals.section = 'tag';
	locals.filters = {
		tag: req.params.tag,
	};
	locals.data = {
		tags: [],
		posts: [],
	};

	// Load all categories
	view.on('init', function (next) {

		keystone.list('PostTag').model.find().sort('name').exec(function (err, results) {

			if (err || !results.length) {
				return next(err);
			}

			locals.data.tags = results;

			// Load the counts for each category
			async.each(locals.data.categories, function (tag, next) {

				keystone.list('Post').model.count().where('tags').in([tag.id]).exec(function (err, count) {
					tag.postCount = count;
					next(err);
				});

			}, function (err) {
				next(err);
			});
		});
	});

	// Load the current tag filter
	view.on('init', function (next) {

		if (req.params.tag) {
			keystone.list('PostTag').model.findOne({ key: locals.filters.tag }).exec(function (err, result) {
				locals.data.tag = result;
				next(err);
			});
		} else {
			next();
		}
	});

	// Load the posts
	view.on('init', function (next) {

		var q = keystone.list('Post').paginate({
			page: req.query.page || 1,
			perPage: 10,
			maxPages: 10,
			filters: {
				state: 'published',
			},
		})
			.sort('-publishedDate')
			.populate('author categories tags');

		if (locals.data.tag) {
			q.where('tags').in([locals.data.tag]);
		}

		q.exec(function (err, results) {
			locals.data.posts = results;
			next(err);
		});
	});

	// Render the view
	view.render('tag');
};
