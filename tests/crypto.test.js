import test from "node:test"
import assert from "node:assert/strict"
import { generatePassword, getPasswordStrength, hashString } from "../src/utils/crypto.js"

test('hashString hashes "Test123!" with SHA-256', async () => {
  const hash = await hashString("Test123!")
  assert.equal(hash, "54de7f606f2523cba8efac173fab42fb7f59d56ceff974c8fdb7342cf2cfe345")
})

test("hashString hashes empty string correctly", async () => {
  const hash = await hashString("")
  assert.equal(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
})

test("getPasswordStrength returns expected score bands", () => {
  assert.equal(getPasswordStrength("abc"), 0)
  assert.equal(getPasswordStrength("abcdefgh"), 1)
  assert.equal(getPasswordStrength("Abcdefgh123!"), 4)
})

test("generatePassword returns null when no character groups are selected", () => {
  const generated = generatePassword({
    length: 16,
    upper: false,
    lower: false,
    numbers: false,
    symbols: false,
  })
  assert.equal(generated, null)
})

test("generatePassword respects selected character groups and requested length", () => {
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
