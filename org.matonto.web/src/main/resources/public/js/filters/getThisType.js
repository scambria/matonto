(function() {
    'use strict';

    angular
        .module('getThisType', [])
        .filter('getThisType', getThisType);

    function getThisType() {
        return function(arr, type) {
            var result = [];

            if(Array.isArray(arr) && arr.length && type) {
                var lowercaseTypes,
                    i = 0;

                while(i < arr.length) {
                    lowercaseTypes = arr[i]['@type'].map(function(item) {
                        return item.toLowerCase();
                    });
                    if(lowercaseTypes.indexOf(type.toLowerCase()) !== -1) {
                        result.push(arr[i]);
                    }
                    i++;
                }
            } else if(!type) {
                console.error('The type was missing.', type);
                result = result.concat(arr);
            }

            return result;
        }
    }
})();