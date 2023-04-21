/*
const fs = require("fs"); // required at the top of your module

// declaring variables with arrays 
var posts = [];
var categories = [];
*/


// adding the lines
const Sequelize = require('sequelize');

// defining the post and cattegories models
const { gte } = Sequelize.Op;

// adding another lines for assignment 5
var sequelize = new Sequelize('tmepeizt', 'tmepeizt', 'HkMTUQnpXHLr5N3oLDM7bEklaf_UgXsC', {
  host: 'isilo.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
  ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
 });


// defining modules
// posts
const Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});
//for categories
const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});
// relation between the posts and categories
Post.belongsTo(Category, { foreignKey: "category" });




//initialization and reading of file 
initialize = () => {
    return new Promise((resolve, reject) => {
      sequelize
      .sync()
      .then(() => {
        console.log("Database synchronized successfully.")
        resolve();
      })
      .catch(() => {
        reject("Unable to sync to the database.");
      });
    })
};



// for the posts
getAllPosts = () => {
    return new Promise((resolve, reject) => {
      Post.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
    });
};



// for the published posts
getPublishedPosts = () => {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
};



// getPublishedPostsByCategories(Assignment4)
getPublishedPostsByCategory = function(category){
    return new Promise((resolve,reject)=>{
      reject();
    });
}



// for the categories
getCategories = () => {
    return new Promise((resolve, reject) => {
      Category.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });    })
};



//for addPosts
addPost = (postData)  => {
  return new Promise((resolve, reject) => {
    postData.published = postData.published ? true : false;
    for (const i in postData) {
      if (postData[i] === "") {
        postData[i] = null;
      }
    }
    postData.postDate = new Date();
    Post.create(postData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Unable to create post");
      });
  });
  };



  // post by categories
getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
      Post.findAll({
        where: {
          category: category,
        },
      })
        .then((data) => {
          console.log(category);
          resolve(data);
        })
        .catch(() => {
          reject("No results returned");
        });
     });
};



//minDate post function
getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
      Post.findAll({
        where: {
          postDate: {
            [gte]: new Date(minDateStr),
          },
        },
      })
        .then((data) => {
          resolve(data);
        })
        .catch(() => {
          reject("No results returned");
        });
    });
};



//getting post by id
getPostById = (id) => {
    return new Promise((resolve, reject) => {
      Post.findAll({
        where: {
          id: id,
        },
      })
        .then((data) => {
          resolve(data[0]);
        })
        .catch(() => {
          reject("No results returned");
        });
      });
};



// adding the category function
addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    for (let i in categoryData) {
      if (categoryData[i] === "") {
        categoryData[i] = null;
      }
    }

    Category.create(categoryData)
      .then((category) => {
        resolve(category);
      })
      .catch(() => {
        reject("unable to create category");
      });
  });
};



// deleteCategoryById funtion add
deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        resolve("Destroyed");
      })
      .catch(() => {
        reject("Unable to delete category");
      });
  });
};



// deleting the post by the id     deletePostById(Id)
deletePostById = (id) => {
  return new Promise((resolve, reject) => {
    Post.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        resolve("Destroyed");
      })
      .catch(() => {
        reject("Unable to delete post");
      });
  });
};



// exporting
module.exports = {
    initialize, getAllPosts, getCategories, getPublishedPosts, addPost, getPostsByCategory, getPostsByMinDate, getPostById, getPublishedPostsByCategory, deletePostById, deleteCategoryById, addCategory
};