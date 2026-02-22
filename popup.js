// Get all the elements
var websiteInput = document.getElementById("website")
var usernameInput = document.getElementById("username")
var passwordInput = document.getElementById("password")
var addBtn = document.getElementById("addBtn")
var passwordList = document.getElementById("passwordList")

var secretKey = "my-super-secret-key-123456789012"

// Generate encryption key from secret
async function getEncryptionKey() {
  var encoder = new TextEncoder()
  var keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(secretKey), { name: "PBKDF2" }, false, [
    "deriveBits",
    "deriveKey",
  ])

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("salt-value-12345"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  )
}

// Encrypt password using AES-GCM
async function encryptPassword(password) {
  var encoder = new TextEncoder()
  var key = await getEncryptionKey()
  var iv = crypto.getRandomValues(new Uint8Array(12))

  var encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encoder.encode(password))

  // Combine IV and encrypted data
  var combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  // Convert to base64
  var base64 = btoa(String.fromCharCode.apply(null, combined))
  return base64
}

// Decrypt password using AES-GCM
async function decryptPassword(encryptedPassword) {
  var decoder = new TextDecoder()
  var key = await getEncryptionKey()

  // Decode from base64
  var combined = Uint8Array.from(atob(encryptedPassword), (c) => c.charCodeAt(0))

  // Extract IV and encrypted data
  var iv = combined.slice(0, 12)
  var encrypted = combined.slice(12)

  var decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted)

  return decoder.decode(decrypted)
}

// Load passwords when popup opens
loadPasswords()

// Add button click
addBtn.addEventListener("click", async () => {
  var website = websiteInput.value
  var username = usernameInput.value
  var password = passwordInput.value

  // Check if all fields are filled
  if (website === "" || username === "" || password === "") {
    alert("Please fill all fields!")
    return
  }

  window.chrome.storage.local.get(["passwords"], async (result) => {
    var passwords = result.passwords || []

    var encryptedPassword = await encryptPassword(password)

    // Add new password
    var newPassword = {
      id: Date.now(),
      website: website,
      username: username,
      password: encryptedPassword,
    }

    passwords.push(newPassword)

    // Save back to storage
    window.chrome.storage.local.set({ passwords: passwords }, () => {
      // Clear input fields
      websiteInput.value = ""
      usernameInput.value = ""
      passwordInput.value = ""

      // Reload the list
      loadPasswords()

      alert("Password saved!")
    })
  })
})

// Function to load all passwords
function loadPasswords() {
  window.chrome.storage.local.get(["passwords"], async (result) => {
    var passwords = result.passwords || []

    // Clear the list
    passwordList.innerHTML = ""

    // If no passwords
    if (passwords.length === 0) {
      passwordList.innerHTML = '<p class="no-passwords">No passwords saved yet</p>'
      return
    }

    // Show all passwords
    for (var i = 0; i < passwords.length; i++) {
      var pass = passwords[i]

      var decryptedPassword = await decryptPassword(pass.password)

      var div = document.createElement("div")
      div.className = "password-item"

      var websiteText = document.createElement("strong")
      websiteText.textContent = pass.website

      var usernameText = document.createElement("p")
      usernameText.textContent = "Username: " + pass.username

      var passwordText = document.createElement("p")
      passwordText.textContent = "Password: ••••••••"
      passwordText.id = "pass-" + pass.id

      var showBtn = document.createElement("button")
      showBtn.className = "show-password"
      showBtn.textContent = "Show"
      showBtn.onclick = ((id, realPassword) =>
        function () {
          var elem = document.getElementById("pass-" + id)
          if (elem.textContent === "Password: ••••••••") {
            elem.textContent = "Password: " + realPassword
            this.textContent = "Hide"
          } else {
            elem.textContent = "Password: ••••••••"
            this.textContent = "Show"
          }
        })(pass.id, decryptedPassword)

      var deleteBtn = document.createElement("button")
      deleteBtn.className = "delete-btn"
      deleteBtn.textContent = "Delete"
      deleteBtn.onclick = ((id) => () => {
        deletePassword(id)
      })(pass.id)

      div.appendChild(websiteText)
      div.appendChild(usernameText)
      div.appendChild(passwordText)
      div.appendChild(showBtn)
      div.appendChild(deleteBtn)

      passwordList.appendChild(div)
    }
  })
}

// Function to delete password
function deletePassword(id) {
  window.chrome.storage.local.get(["passwords"], (result) => {
    var passwords = result.passwords || []

    // Filter out the password to delete
    var newPasswords = []
    for (var i = 0; i < passwords.length; i++) {
      if (passwords[i].id !== id) {
        newPasswords.push(passwords[i])
      }
    }

    // Save back to storage
    window.chrome.storage.local.set({ passwords: newPasswords }, () => {
      loadPasswords()
      alert("Password deleted!")
    })
  })
}
