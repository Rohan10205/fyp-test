import test from "node:test"
import assert from "node:assert/strict"
import {
  decryptPassword,
  encryptPassword,
  generatePassword,
  getPasswordStrength,
  hashString,
  STRENGTH_META,
} from "../src/utils/crypto.js"

test('UT-01 hashString hashes "Test123!" with SHA-256', async () => {
  const hash = await hashString("Test123!")
  assert.equal(hash, "54de7f606f2523cba8efac173fab42fb7f59d56ceff974c8fdb7342cf2cfe345")
})

test("UT-02 hashString hashes empty string correctly", async () => {
  const hash = await hashString("")
  assert.equal(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
})

test("UT-03 getPasswordStrength returns expected score bands", () => {
  assert.equal(getPasswordStrength("abc"), 0)
  assert.equal(getPasswordStrength("abcdefgh"), 1)
  assert.equal(getPasswordStrength("Abcdefgh123!"), 4)
})

test("UT-04 generatePassword returns null when no character groups are selected", () => {
  const generated = generatePassword({
    length: 16,
    upper: false,
    lower: false,
    numbers: false,
    symbols: false,
  })
  assert.equal(generated, null)
})

test("UT-05 generatePassword respects selected character groups and requested length", () => {
  const generated = generatePassword({
    length: 24,
    upper: true,
    lower: false,
    numbers: true,
    symbols: false,
  })

  assert.equal(generated.length, 24)
  assert.match(generated, /^[A-Z0-9]+$/)
})

test("UT-06 getPasswordStrength scores length+numbers without mixed case/symbols", () => {
  assert.equal(getPasswordStrength("abcdefgh1234"), 3)
})

test("UT-07 getPasswordStrength is capped at 4", () => {
  assert.equal(getPasswordStrength("Abcdefgh1234!@#"), 4)
})

test("UT-08 generatePassword lower-only output contains only lowercase chars", () => {
  const generated = generatePassword({
    length: 30,
    upper: false,
    lower: true,
    numbers: false,
    symbols: false,
  })

  assert.equal(generated.length, 30)
  assert.match(generated, /^[a-z]+$/)
})

test("UT-09 encryptPassword and decryptPassword round-trip recovers plaintext", async () => {
  const masterPassword = "Master#2026"
  const plainPassword = "MySitePassword!123"

  const encrypted = await encryptPassword(plainPassword, masterPassword)
  const decrypted = await decryptPassword(encrypted, masterPassword)

  assert.notEqual(encrypted, plainPassword)
  assert.equal(decrypted, plainPassword)
})

test("UT-10 STRENGTH_META exposes 5 strength levels", () => {
  assert.equal(STRENGTH_META.length, 5)
  assert.deepEqual(
    STRENGTH_META.map((item) => item.label),
    ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"]
  )
})
