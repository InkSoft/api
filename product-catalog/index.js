$(document).ready(function () {
  var settings = {
    domain: 'stores.inksoft.com',
    storeID: 433,
    storeURI: 'demo',
    sslDomain: 'stores.inksoft.com',
    sslEnabled: false
  };

  var api = new ProductCatalogAPI(settings);
  api.getProductCategories(function (categories) {
    showCategories(categories);
  });

  function showCategories(categories) {
    var productCategoryTemplate = Handlebars.compile($("#category-template").html());
    Handlebars.registerPartial("category-template", $("#category-template").html());
    for (var i = 0; i < categories.length; i++) {
      var category = categories[i];
      $("#product-categories").append(productCategoryTemplate(category));
    }
    categoriesReady();
  }

  function categoriesReady() {
    $(".category-link").click(function(event) {
      event.preventDefault();
      var productCategoryID = $(this).attr("data-category-id");
      api.getProductsByCategory(productCategoryID, 0, 0, function(products) {
        showProducts(products);
      }, function(msg) {
        alert(msg);
      });
    })
  }

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

  }
});