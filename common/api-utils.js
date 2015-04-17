window.APIUtils = function (settings) {
  var _self = this;
  this.fixImageUrl = function (imageUrl) {
    if (!imageUrl) {
      return imageUrl;
    }
    //sometimes this is returned as http://REPLACE_DOMAIN_WITH, sometimes just REPLACE_DOMAIN_WITH with no protocol.
    imageUrl = imageUrl.replace("http://REPLACE_DOMAIN_WITH", "http://" + settings.domain);
    imageUrl = imageUrl.replace("https://REPLACE_DOMAIN_WITH", "https://" + (settings.sslDomain ? settings.sslDomain : settings.domain));
    if (document.location.href.indexOf("file") !== 0) { //for testing locally.  Make sure it goes to http instead of the file:// protocol
      imageUrl = imageUrl.replace("REPLACE_DOMAIN_WITH", "//" + settings.domain);
    } else {
      imageUrl = imageUrl.replace("REPLACE_DOMAIN_WITH", "http://" + settings.domain);
    }
    return imageUrl;
  };


  this.arrangeHierarchy = function(flatList, idGetter, parentIDGetter) {
    var hierarchy = [];
    for (var i = 0; i < flatList.length; i++) {
      var parentID = parentIDGetter(flatList[i]);
      var id = idGetter(flatList[i]);

      if (parentID) {
        //this item has a parent,
        for (var j = 0; j < flatList.length; j++) {
          if (idGetter(flatList[j]) == parentID) {
            if (typeof (flatList[j].children) === 'undefined') {
              flatList[j].children = [];
            }
            flatList[j].children.push(flatList[i]);
            flatList[i].parent = flatList[j];
          }
        }
      } else {
        //this item doesn't have a parent, so it goes into the main hierarchy.
        hierarchy.push(flatList[i]);
      }
    }
    return hierarchy;
  };

  //Takes an xml node (usually the root node at first), and converts it into a js object.
  //settings is an object that designates which properties should be arrays and which should be singles.  The default is array.
  this.deserializeXml = function (parentNode, settings) {
    if (!parentNode) {
      return null;
    }
    var $parentNode = $(parentNode);
    var result = null;
    if ((parentNode.attributes && parentNode.attributes.length > 0) || $parentNode.children().length > 0) {
      //result is the deserialized object we return.
      result = {};

      //the attributes are just simple values, we put them in as they are.
      if (parentNode.attributes) {
        for (var i = 0; i < parentNode.attributes.length; i++) {
          var name = parentNode.attributes[i].name;
          var value = parentNode.attributes[i].value;
          if (value.indexOf("REPLACE_DOMAIN_WITH") >= 0) {
            value = _self.fixImageUrl(value);
          }
          if (value === "0" || value === "1") //only do this for limited cases, in case of things like design name = "00000" or some such nonsense.
          {
            value = parseInt(value);
          }
          result[name] = value;
        }
      }

      //children might be simple values, a single nested child, or an array.
      //if the children don't have any attributes or children themselves and there is only one child with that tag name, we treat it
      //the same as an attribute and use its innerText as the value.  If there is more than one child with that tag name, we deserialize it as an array.
      //If there is only one child with that tag name but it has attributes or nested children, the default is to deserialize it as an array but this can be overridden by
      //the settings if there's a 'tagName': { 'mode': 'single or merge' } value in it.  If mode is set to single, we deserialize it (recursively)
      //and attach it to the parent['tagName'].  If its set to 'merge', we deserialize it (recursively) but move all its properties to the parent rather than give the parent
      //another property.  This is helpful in some cases
      //ie <ThisDesign><design>...</design><art>...</art></ThisDesign> should be <ThisDesign><design>...<art>...</art>...</design></ThisDesign>
      var children = $parentNode.children();
      for (i = 0; i < children.length; i++) {
        var child = children[i];
        var $child = $(child);
        var childName = child.tagName;
        var childSettings = (settings === null || typeof settings[childName] === 'undefined') ? {
          'mode': 'array',
          'name': childName
        } : settings[childName];
        if (typeof childSettings.name != 'undefined' && childSettings.name) {
          childName = childSettings.name;
        } else if (childName && childSettings && !childSettings.name) {
          childSettings.name = childName;
        }
        var childObject = _self.deserializeXml(child, settings);
        if (result[childName]) {
          //if there's already something there, then this property should be an array.
          var oldValue = result[childSettings.name];
          if (oldValue && typeof oldValue.push != 'undefined') {
            //already an array, just push this value into it.
            oldValue.push(childObject);
          } else {
            //two children have the same tag name, we turn this into an array regardless of what the settings say we should do.
            result[childSettings.name] = [];
            result[childSettings.name].push(oldValue);
            result[childSettings.name].push(childObject);
          }
        } else {
          if (childSettings.mode === 'single') {
            result[childSettings.name] = childObject;
          }//later we may turn this into an array if there are more than one of this tag name at the same level.
          else if (childSettings.mode === 'merge') { //if there are two children with this tag name and it is set to 'merge', the last child's properties
            //will overwrite previous ones.  If that happens, something is probably broken since merge should only be set on 1:1 relationships.
            for (var key in childObject) {
              result[key] = childObject[key];
            }
          }
          else {
            //if there's no settings for this tag name or if settings.tagName.Mode === "Array"
            result[childSettings.name] = [];
            result[childSettings.name].push(childObject);
          }
        }
      }
    } else { //no attributes and no children - just return a simple value.
      result = $parentNode.text();
    }
    return result;
  }
};