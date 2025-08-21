let map;
let posts = [];
let markers = [];
let pendingPostLatLng = null;


window.onload = function() {
  initMap();
  loadPosts();
  document.getElementById("submit").addEventListener("click", addPost);
};

// 地図の初期化
function initMap() {
  
  const defaultPos = { lat: 35.681236, lng: 139.767125 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 14
  });

  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        map.setCenter(defaultPos);
      }
    );
  } else {
    map.setCenter(defaultPos);
  }


  map.addListener("click", function(e) {
    pendingPostLatLng = e.latLng;
   
    if (window.tempMarker) window.tempMarker.setMap(null);
    window.tempMarker = new google.maps.Marker({
      position: pendingPostLatLng,
      map: map,
      icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
    });
  });
}


function addPost() {
  const msg = document.getElementById("message").value.trim();
  const type = document.getElementById("type").value;

  if (!msg) {
    alert("投稿内容を入力してください。");
    return;
  }

  if (!pendingPostLatLng) {
    alert("地図上で投稿したい場所をクリックしてください。");
    return;
  }

  const newPost = {
    id: Date.now(),
    message: msg,
    type: type,
    lat: pendingPostLatLng.lat(),
    lng: pendingPostLatLng.lng(),
    timestamp: new Date().toLocaleString()
  };

  posts.push(newPost);
  savePosts();
  renderAll();
  document.getElementById("message").value = "";

 
  if (window.tempMarker) {
    window.tempMarker.setMap(null);
    window.tempMarker = null;
  }
  pendingPostLatLng = null;
}


function getMarkerIcon(type) {
  switch(type) {
    case "事故":
     
      return "https://maps.google.com/mapfiles/kml/shapes/caution.png";
    case "渋滞":
      
      return "https://maps.google.com/mapfiles/kml/shapes/cabs.png";
    case "口コミ":
      
      return "https://cdn.jsdelivr.net/gh/encharm/Font-Awesome-SVG-PNG@master/black/png/32/comment-o.png";
    case "その他の交通情報":
    default:
      
      return "https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png";
  }
}


function renderAll() {
 
  markers.forEach(m => m.setMap(null));
  markers = [];


  const list = document.getElementById("list");
  list.innerHTML = "";


  posts.forEach(post => {
    let icon = getMarkerIcon(post.type);
    
    if (post.type === "口コミ") {
      icon = {
        url: getMarkerIcon(post.type),
        scaledSize: new google.maps.Size(60, 60) 
      };
    }
    const marker = new google.maps.Marker({
      position: { lat: post.lat, lng: post.lng },
      map: map,
      icon: icon,
      title: post.message
    });

    markers.push(marker);

    const info = new google.maps.InfoWindow({
      content: `
    <div style="font-size:1.7em; font-weight:bold; color:#c62828; line-height:1.3;">
      ${post.message}
    </div>
    <div style="font-size:1.1em; color:#555; margin-top:6px;">
      <b>${post.type}</b>　${post.timestamp}
    </div>
  `
    });

    marker.addListener("click", () => {
      info.open(map, marker);
    });

    
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `<b>[${post.type}]</b> ${post.message} <br><small>${post.timestamp}</small>
      <button style="float:right;" onclick="deletePost(${post.id})">削除</button>`;
    list.prepend(div);
  });
}


window.deletePost = function(id) {
  posts = posts.filter(p => p.id !== id);
  savePosts();
  renderAll();
};


function savePosts() {
  try {
    localStorage.setItem("posts", JSON.stringify(posts));
  } catch (e) {
    alert("保存に失敗しました");
  }
}


function loadPosts() {
  const data = localStorage.getItem("posts");
  if (data) {
    try {
      posts = JSON.parse(data);
    } catch (e) {
      posts = [];
    }
    renderAll();
  }
}