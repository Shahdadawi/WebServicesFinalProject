  const map = document.getElementById('google-map');
  const loader = document.getElementById('map-loader');

  map.addEventListener('load', () => {
    loader.style.display = 'none';
  });
