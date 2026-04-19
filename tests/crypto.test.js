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

test('UT-01 hashString hashes "Test123!" with SHA-256', async (t) => {
  const input = "Test123!"
  const hash = await hashString("Test123!")
  const expected = "54de7f606f2523cba8efac173fab42fb7f59d56ceff974c8fdb7342cf2cfe345"
  t.diagnostic(`input=${input}`)
  t.diagnostic(`expectedHash=${expected}`)
  t.diagnostic(`actualHash=${hash}`)
  assert.equal(hash, expected)
})

test("UT-02 hashString hashes empty string correctly", async (t) => {
  const input = ""
  const hash = await hashString("")
  const expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  t.diagnostic(`input=(empty string)`)
  t.diagnostic(`expectedHash=${expected}`)
  t.diagnostic(`actualHash=${hash}`)
  assert.equal(hash, expected)
})

test("UT-03 getPasswordStrength returns expected score bands", (t) => {
  const weak = "abc"
  const medium = "abcdefgh"
  const strong = "Abcdefgh123!"
  const weakScore = getPasswordStrength(weak)
  const mediumScore = getPasswordStrength(medium)
  const strongScore = getPasswordStrength(strong)
  t.diagnostic(`weakPasswordValue=<redacted>, score=${weakScore}, expected=0`)
  t.diagnostic(`mediumPasswordValue=<redacted>, score=${mediumScore}, expected=1`)
  t.diagnostic(`strongPasswordValue=<redacted>, score=${strongScore}, expected=4`)
  assert.equal(weakScore, 0)
  assert.equal(mediumScore, 1)
  assert.equal(strongScore, 4)
})

test("UT-04 generatePassword returns null when no character groups are selected", (t) => {
  const generated = generatePassword({
    length: 16,
    upper: false,
    lower: false,
    numbers: false,
    symbols: false,
  })
  t.diagnostic(`options={"length":16,"upper":false,"lower":false,"numbers":false,"symbols":false}`)
  t.diagnostic(`generated=${String(generated)}`)
  assert.equal(generated, null)
})

test("UT-05 generatePassword respects selected character groups and requested length", (t) => {
  const options = {
    length: 24,
    upper: true,
    lower: false,
    numbers: true,
    symbols: false,
  }
  const generated = generatePassword(options)

  t.diagnostic(`options=${JSON.stringify(options)}`)
  t.diagnostic(`generated=<redacted, length=${generated.length}>`)
  assert.equal(generated.length, 24)
  assert.match(generated, /^[A-Z0-9]+$/)
})

test("UT-06 getPasswordStrength scores length+numbers without mixed case/symbols", (t) => {
  const input = "abcdefgh1234"
  const score = getPasswordStrength(input)
  t.diagnostic(`input=<redacted>, score=${score}, expected=3`)
  assert.equal(score, 3)
})

test("UT-07 getPasswordStrength is capped at 4", (t) => {
  const input = "Abcdefgh1234!@#"
  const score = getPasswordStrength(input)
  t.diagnostic(`input=<redacted>, score=${score}, expected=4`)
  assert.equal(score, 4)
})

test("UT-08 generatePassword lower-only output contains only lowercase chars", (t) => {
  const options = {
    length: 30,
    upper: false,
    lower: true,
    numbers: false,
    symbols: false,
  }
  const generated = generatePassword(options)

  t.diagnostic(`options=${JSON.stringify(options)}`)
  t.diagnostic(`generated=<redacted, length=${generated.length}>`)
  assert.equal(generated.length, 30)
  assert.match(generated, /^[a-z]+$/)
})

test("UT-09 encryptPassword and decryptPassword round-trip recovers plaintext", async (t) => {
  const masterPassword = "Master#2026"
  const plainPassword = "MySitePassword!123"

  const encrypted = await encryptPassword(plainPassword, masterPassword)
  const decrypted = await decryptPassword(encrypted, masterPassword)

  t.diagnostic("masterPasswordProvided=true")
  t.diagnostic("plainPasswordProvided=true")
  t.diagnostic(`encrypted=<redacted, length=${encrypted.length}>`)
  t.diagnostic(`decryptedMatchesPlain=${decrypted === plainPassword}`)
  assert.notEqual(encrypted, plainPassword)
  assert.equal(decrypted, plainPassword)
})

test("UT-10 STRENGTH_META exposes 5 strength levels", (t) => {
  const labels = STRENGTH_META.map((item) => item.label)
  t.diagnostic(`strengthMetaLength=${STRENGTH_META.length}`)
  t.diagnostic(`strengthMetaLabels=${labels.join(", ")}`)
  assert.equal(STRENGTH_META.length, 5)
  assert.deepEqual(labels, ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"])
})
