(function (root, factory) {
  if (typeof exports === 'object') module.exports = factory();
  else if (typeof define === 'function' && define.amd) define(factory);
  else root.Prefetch = factory();
})(this, function () {

  function Prefetch(){
    var self = this;
    self.$prefetchOnMousedown = false;
    self.$enableTouch = false;
    self.$delayBeforePrefetch = 50;
    self.$exclusions = [];

    self.init = function(config){
      config = config || {};
      self.$prefetchOnMousedown = config.waitForMousedown || self.$prefetchOnMousedown;
      self.$enableTouch = config.enableTouch || self.$enableTouch;
      self.$delayBeforePrefetch = config.hoverDelay || self.$delayBeforePrefetch;
      self.$exclusions = config.exclusions || self.$exclusions;
      config.containers = config.containers || [];
      self.addContainers(config.containers);
    }

    self.prefetch = function(a){
      a = a || self.$anchorToPrefetch;
      if(self.$prefetchTimer){
        clearTimeout(self.$prefetchTimer);
        self.$prefetchTimer = false;
      }
      if(Object.prototype.toString.call(a) === '[object Array]'){
        for(var i = 0; i < a.length; ++i){
          injectIframe(a[i]);
        }
      }
      else{
        injectIframe2(a);
      }
    }

    self.addContainers = function(containers){
      for(var i = 0; i < containers.length; ++i){
        var el = document.querySelector(containers[i]);
        if(el){
          if(self.$enableTouch){
            attachListener(el, 'touchstart');
          }
          if(self.$prefetchOnMousedown){
            attachListener(el, 'mousedown');
          }
          else{
            attachListener(el, 'mouseover');
          }
        }
      }
    }

    self.addExclusions = function(exclusions){
      self.$exclusions = self.$exclusions.concat(exclusions);
    }

    function removeHash(url){
      var index = url.indexOf('#');
      return (index < 0) ? url : url.substr(0, index);
    }

    function getLinkTarget(target){
      while(target && target.nodeName != 'A'){
        target = target.parentNode;
      }
      return target;
    }

    function isBlacklisted(elem){
      do{
        if(!elem.hasAttribute){
          break;
        }
        if(elem.hasAttribute('data-no-prefetch')){
          return true;
        }
      } while(elem = elem.parentNode);
      return false;
    }

    function isSamePage(a){
      return a.href.indexOf('#') > -1 && removeHash(a.href) === removeHash(location.href);
    }

    function isExcluded(a){
      if(self.$exclusions.length){
        for(var i = 0; i < self.$exclusions.length; ++i){
          if(a.href.indexOf(self.$exclusions[i]) > -1){
            return true;
          }
        }
      }
      return false;
    }

    function isPrefetchable(a){
      if(a.hasAttribute('download')
        || !a.href
        || isBlacklisted(a)
        || isSamePage(a)
        || isExcluded(a)){
        return false;
      }
      return true;
    }

    function injectIframe2(a){
      if(a && isPrefetchable(a)){
        var url = (typeof a === 'object') ? a.href : a;
        var iframe = document.createElement('iframe');
        iframe.style = 'display:none;';
        var html = '<head><link rel="prefetch" href="'+url+'"></head>';
        document.body.appendChild(iframe);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();
        if(typeof a === 'object'){
          a.setAttribute('data-no-prefetch', '');
        }
      }
    }

    function touchstart(e){
      self.$lastTouchTimestamp = new Date().getTime();
      var a = getLinkTarget(e.target);
      injectPrefetchLink(a);
    }

    function mousedown(e){
      if(self.$lastTouchTimestamp > (new Date().getTime() - 500)){
        return;
      }
      var a = getLinkTarget(e.target);
      injectPrefetchLink(a);
    }

    function mouseover(e){
      if(self.$lastTouchTimestamp > (new Date().getTime() - 500)){
        return;
      }
      var a = getLinkTarget(e.target);
      if(a && isPrefetchable(a)){
        a.addEventListener('mouseout', mouseout);
        if(!self.$delayBeforePrefetch){
          injectPrefetchLink(a);
        }
        else{
          self.$anchorToPrefetch = a;
          self.$prefetchTimer = setTimeout(self.prefetch, self.$delayBeforePrefetch);
        }
      }
    }

    function mouseout(){
      if(self.$prefetchTimer){
        clearTimeout(self.$prefetchTimer);
        self.$prefetchTimer = false;
      }
    }

    function attachListener(el, type){
      el.addEventListener(type, function (e){
        if(e.target.matches('a')){
          switch(type){
            case 'touchstart': touchstart(e); break;
            case 'mousedown':  mousedown(e);  break;
            case 'mouseover':  mouseover(e);  break;
          }
        }
      });
    }
  }
    
  return new Prefetch();
});
