/*********************************************************************************
* WEB322 – Assignment 02
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: _____Neron Nelson Parmar_____ Student ID: __171690217__ Date: __4/4/23__
*
* Cyclic Web App URL: _____________https://embarrassed-garment-dove.cyclic.app/____________
*
* GitHub Repository URL: __________https://github.com/neronparmar01/web322-app.git__________
*
********************************************************************************/
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
var express = require("express");
var app = express();
const stripJs = require('strip-js');
var blogservice = require("./blog-service.js");
var path = require("path");
var authData = require("./auth-service.js");  // requiring auth serivce assign 6
var clientSessions = require("client-sessions");


// get route for the handle bars
app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    navLink: function (url, options) {
      return `<a class="nav-link ${url == app.locals.activeRoute ? 'active' : ''
        }" href="${url}">${options.fn(this)}</a>`;
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error('Handlebars Helper equal needs 2 parameters');
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    safeHTML: function (context) {
      return stripJs(context);
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    },
  },
}),
);
//set route for handle bars
app.set('view engine', '.hbs');


//setting up the cloudinary config
cloudinary.config({
  cloud_name: 'dmkx6jl7u',
  api_key: '331761398114722',
  api_secret: 'LS-rG40AfPN5m0ObEgWfLxTVBi0',
  secure: true
});


//creating an upload variable
const upload = multer(); // no { storage: storage }


var HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public')); // using static middleware for files

// settting up the client sessions assignment 6
app.use(clientSessions({
  cookieName: "session", 
  secret: "web322blogapplication",
  duration: 2 * 60 * 1000, 
  activeDuration: 1000 * 60 
}));
app.use((req, res, next) =>{
  res.locals.session = req.session;
  next();
});
 
// middleware function for ensuring the login
function ensureLogin (req, res, next)  {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// the route for middleware (assignment-4)
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});


// the url encoded middleware
app.use(express.urlencoded({ extended: true }));


// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// setup a 'route' to listen on the default url path (http://localhost)
app.get('/', (req, res) => {
  res.redirect("/blog");
});

// setup another route to listen on /about
app.get("/about", (req, res) => {
  res.render("about");
});

// new routes using then 
// for published posts
app.get("/post", (req, res) => {
  getAllPosts().then((data) => {
    res.json({ data });
  }).catch((err) => {
    res.json({ message: err });
  })
});

// for categories
app.get("/categories", ensureLogin, (req, res) => {
  getCategories().then((data) => {
    data.length > 0
      ? res.render("categories", { categories: data })
      : res.render("categories", { message: "No Results" });
  }).catch(() => {
    res.render("categories", { message: "no results" });
  });
});

// for blogs
app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData })

});

//for posts
app.get("/posts/add", ensureLogin, (req, res) => {
  getCategories()
    .then((categories) => {
      res.render("addPost", { categories: categories });
    })
    .catch(() => {
      res.render("addPost", { categories: [] });
    });
});

//adding the post route
app.post('/posts/add', ensureLogin, upload.single('featureImage'), async (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost('');
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl;

    // Process the req.body and add it as a new Blog Post before redirecting to /posts
    const postData = {
      id: 0,
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      featured: req.body.featured === 'on',
      published: req.body.published === 'on',
      featureImage: req.body.featureImage,
      date: new Date().toDateString(),
    };
    addPost(postData);
  }
  getAllPosts().then((data) => {
    res.json({ data });
  }).catch((err) => {
    res.json({ message: err });
  })
});

module.exports = app;

//for the posts
app.get("/posts",ensureLogin, (req, res) => {
  console.log(req.query.category);
  if (req.query.category) {
    getPublishedPostsByCategory(req.query.category).then((data) => {
      data.length > 0
        ? res.render("posts", { posts: data })
        : res.render("posts", { message: "No Results" });
    }).catch((err) => {
      res.render("posts", { message: "no results" });
    });
  } else if (req.query.minDate) {
    getPostsByMinDate(req.query.minDate).then((data) => {
      data.length > 0
        ? res.render("posts", { posts: data })
        : res.render("posts", { message: "No Results" });
    }).catch((err) => {
      res.render("posts", { message: "no results" });
    });
  } else {
    getAllPosts().then((data) => {
      data.length > 0
        ? res.render("posts", { posts: data })
        : res.render("posts", { message: "No Results" });
    }).catch((err) => {
      res.render("posts", { message: "no results" });
    });
  }
});

/// new route to add the single blog posts
app.get('/blog/:id', ensureLogin, async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogData.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData })
});


// step 2
// new route to get a single post by ID
app.get('/post/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const post = getPostById(postId);

  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ message: `Post with id ${postId} not found` });
  }
});



// adding the category
app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});


// add category 2
app.post("/categories/add", ensureLogin, (req, res) => {
  let catObject = {};
  catObject.category = req.body.category;
  console.log(req.body.category);
  if (req.body.category != "") {
    addCategory(catObject)
      .then(() => {
        res.redirect("/categories");
      })
      .catch(() => {
        console.log("Some error occured");
      });
  }
});



// adding the categories/delete using the id
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch(() => {
      console.log("Unable to remove category / Category not found");
    });
});


// adding the posts/delete using the id route
app.get("/posts/delete/:id", ensureLogin, (req, res) => {
  deletePostById(req.params.id)
    .then(() => {
      res.redirect("/posts");
    })
    .catch(() => {
      console.log("Unable to remove category / Category not found");
    });
});


//setting paths for authData
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/posts');
    })
    .catch((err) => {
      res.render('login', {errorMessage: err, userName: req.body.userName});
    });
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
  .then(() => {
    res.render('register', { successMessage: 'User created' });
  })
  .catch((err) => {
    res.render('register', { errorMessage: err, userName: req.body.userName });
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// setup http server to listen on HTTP_PORT
//app.listen(HTTP_PORT, onHttpStart);

// initialize the blog-service module
initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT)
    });
  }).catch(function (err) {
    console.log("unable to start server: " + err);
  });

// for error not found (404)
app.get('/error', (req, res) => {
  res.status(404).send('Page not found');
});