//this file is the starting point for the api integration.  When the document loads, we call out to InkSoft's API
//to get product categories.  Then we attach event handlers for when the categories get clicked to bring in products
//in that category.
$(document).ready(function () {

  //These are the settings for demo.inksoft.com.
  var settings = {
    domain: 'stores.inksoft.com', //the domain for API calls to hit
    storeID: 433, //The numeric ID of the store to get data from.
    storeURI: 'demo', //the last portion of the "InkSoft" store URL, like 'demo' in 'http://stores.inksoft.com/demo/'
    sslDomain: 'stores.inksoft.com' //the URL to hit when making a call over SSL.
  };

  //make the ajax API call to get all product categories
  var api = new ProductCatalogAPI(settings);
  api.getProductCategories(function (categories) {
    showCategories(categories);
  });

  //once the product categories have been retrieved, merge them with our handlebars templates to make HTML
  //then add them to the document.  Using handlebars is not required for API interaction, we're just using it here because
  //it's great for keeping these examples readable without cluttering the code with HTML generation.
  // For more information on handlebars, please visit http://handlebarsjs.com/
  function showCategories(categories) {
    var productCategoryTemplate = Handlebars.compile($("#category-template").html());
    Handlebars.registerPartial("category-template", $("#category-template").html());
    for (var i = 0; i < categories.length; i++) {
      var category = categories[i];
      $("#product-categories").append(productCategoryTemplate(category));
    }
    categoriesReady();
  }

  //Once the categories have been added to the document, assign an event handler to show their corresponding products
  //whenever they are clicked.
  function categoriesReady() {
    $(".category-link").click(function(event) {
      event.preventDefault();

      //get the category ID of the category that has been clicked, then pass that in to the API to get a list of products.
      var productCategoryID = $(this).attr("data-category-id");
      api.getProductsByCategory(productCategoryID, 0, 0, function(products) {
        //we got some products back, show them on the screen.
        showProducts(products);
      }, function(msg) {
        alert(msg);
      });
    })
  }

  //once products have been retrieved from the API, clear any existing products and render/add the newly retrieved ones.
  function showProducts(products) {
    $("#products").empty();
    var productTemplate = Handlebars.compile($("#products-template").html());
    for (var i = 0; i < products.length; i++) {
      var product = products[i];
      $("#products").append(productTemplate(product));
    }
    productsReady();
  }

  function productsReady() {
    //here we will add some logic to handle what happens when a user clicks a product.
  }
});