let map;
let posts = [];
let markers = [];
let pendingPostLatLng = null;

// 初期化処理
window.onload = function() {
  initMap();
  loadPosts();
  document.getElementById("submit").addEventListener("click", addPost);
};

// 地図の初期化
function initMap() {
  // デフォルト位置（東京駅）
  const defaultPos = { lat: 35.681236, lng: 139.767125 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 14
  });

  // 現在地取得
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

  // 地図クリックで投稿位置をセット
  map.addListener("click", function(e) {
    pendingPostLatLng = e.latLng;
    // ピンを一時的に表示（既存の一時ピンがあれば消す）
    if (window.tempMarker) window.tempMarker.setMap(null);
    window.tempMarker = new google.maps.Marker({
      position: pendingPostLatLng,
      map: map,
      icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
    });
  });
}

// 投稿を追加
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

  // 一時ピンを消す
  if (window.tempMarker) {
    window.tempMarker.setMap(null);
    window.tempMarker = null;
  }
  pendingPostLatLng = null;
}

// マーカーアイコンを決定
function getMarkerIcon(type) {
  switch(type) {
    case "事故":
      // 黄色の三角警告アイコン
      return "https://maps.google.com/mapfiles/kml/shapes/caution.png";
    case "渋滞":
      // 赤色の車アイコン
      return "https://maps.google.com/mapfiles/kml/shapes/cabs.png";
    case "口コミ":
      // フリーの吹き出しアイコン（PNG直リンク例）
      return "https://cdn.jsdelivr.net/gh/encharm/Font-Awesome-SVG-PNG@master/black/png/32/comment-o.png";
    case "その他の交通情報":
    default:
      // 青色の「i」アイコン
      return "https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png";
  }
}

// 投稿を描画（全体再描画）
function renderAll() {
  // 既存マーカー削除
  markers.forEach(m => m.setMap(null));
  markers = [];

  // 投稿リストクリア
  const list = document.getElementById("list");
  list.innerHTML = "";

  // 投稿ごとに描画
  posts.forEach(post => {
    let icon = getMarkerIcon(post.type);
    // 口コミだけ大きく
    if (post.type === "口コミ") {
      icon = {
        url: getMarkerIcon(post.type),
        scaledSize: new google.maps.Size(60, 60) // ←ここでサイズ指定
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

    // 投稿リストに追加
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `<b>[${post.type}]</b> ${post.message} <br><small>${post.timestamp}</small>
      <button style="float:right;" onclick="deletePost(${post.id})">削除</button>`;
    list.prepend(div);
  });
}

// 投稿削除
window.deletePost = function(id) {
  posts = posts.filter(p => p.id !== id);
  savePosts();
  renderAll();
};

// LocalStorage 保存
function savePosts() {
  try {
    localStorage.setItem("posts", JSON.stringify(posts));
  } catch (e) {
    alert("保存に失敗しました");
  }
}

// LocalStorage 読み込み
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
