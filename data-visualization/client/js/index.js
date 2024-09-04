var username = "naquerf"


fetch("http://127.0.0.1:8000/users/"+username)
  .then((response) => response.json())
  .then((json) => document.getElementById("username").innerHTML = json.display_name)