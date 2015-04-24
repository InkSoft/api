// class that encapsulates all the product-related API calls (GetProductCategoryList, GetProductList, and GetProduct)
window.ProductCatalogAPI = function (settings) {
  var apiUtils = new APIUtils(settings); //utility methods we'll use to parse the output

  //Gets ALL categories in the store, including all subcategories.  Returns them in a hierarchial javascript object
  this.getProductCategories = function (success, error) {
    $.ajax({
      url: 'http://' + settings.domain + '/GetProductCategoryList/' + settings.storeID,
      success: function (xml) {
        var deserializationSettings = {'vw_product_categories': {'name': 'categories'}};
        var allCategories = apiUtils.deserializeXml($(xml).children()[0], deserializationSettings).categories;

        for (var i = 0; i < allCategories.length; i++) {
          var category = allCategories[i];
          var thumbnailURL = category.thumburl;
          if (!thumbnailURL) {
            thumbnailURL = category.thumburl_front;
          }
          category.thumbnailURL = apiUtils.fixImageUrl(thumbnailURL);
        }

        var productTopCategories = apiUtils.arrangeHierarchy(allCategories, function (category) {
          return category.product_category_id;
        }, function (category) {
          return category.parent_id
        });

        success(productTopCategories);
      },
      error: error
    });
  };


  //Search the product database for products in a given category or matching a search term.
  //If "includeNonPrintable" is true, pre-decorated and static products will be returned as well.
  this.getProductsByCategory = function (categoryID, searchTerm, includeNonPrintable, success, error) {
    categoryID = categoryID || 0;
    searchTerm = searchTerm || '';
    includeNonPrintable = includeNonPrintable || '0';

    var url = 'http://' + settings.domain + '/GetProductList/' + settings.storeID + '/' + categoryID + '/' + searchTerm + '/' + includeNonPrintable;
    $.ajax({
      url: url,
      success: function (xml) {
        var deserializationSettings = {'products': {'name': 'product', 'mode': 'merge'}};
        var result = apiUtils.deserializeXml($(xml).children()[0], deserializationSettings).CS;
        if (result && result.length) {
          for (var i = 0; i < result.length; i++) {
            var product = result[i];
            var thumbnailURL = product.thumburl;
            if (!thumbnailURL) {
              thumbnailURL = product.thumburl_front;
            }
            product.thumbnailURL = thumbnailURL;
          }
        }
        success(result);
      },
      error: error
    });
  };



  //Load the product
  this.getProductDetails = function (idProduct, idStyle, success, error) {
    var url = 'http://' + settings.domain + '/GetProduct/' + settings.storeID + '/' + idProduct + '/' + idStyle
    $.ajax({
      url: url,
      success: function (xml) {
        var deserializationSettings = {'products': {'name': 'product', 'mode': 'merge'}};
        var product = apiUtils.deserializeXml($(xml).children()[0], deserializationSettings);
        product.default_style = product.product_styles[0];
        product.default_region = product.default_style.product_regions[0];
        success(product);
      },
      error: error
    });
  };
};