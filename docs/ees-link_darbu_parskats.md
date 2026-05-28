# Darāmo darbu saraksts

## Priekšgalam

### Lapa, kur virsadministrators var akceptēt komandu pieteikumus.

Lapā ir tabula ar komandu pieteikumiem un darbības ir viena no kolonnām.

Ar darbību "akceptēt" tiek atvērts logs, kurā cik vien iespējams tiek automātiski aizpildīta informācija, lai izsauktu /api/team/{key}
Tur ir tabuliņa ar kontiem, kurus var pievienot komandai.

### Komandu pārskats

Kontu kabinetos komandu vai komandas pārskatam vajadzētu izmantot /api/team-applications pēc kura atgriezto komandu pieteikumu atslēgām tiek for ciklā izsaukts /api/team/{key}

### Kontu reģistrācijas lapa

Obligātie lauki ir:

1. key - tiek ģenerēts priekšgalā. Aizmugurgalā tas tika darīts šādi:
```go

func GenerateSalt(size int) (string, error) {
	if size <= 0 {
		size = 16
	}

	salt := make([]byte, size)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate random salt: %w", err)
	}

	return base64.RawStdEncoding.EncodeToString(salt), nil
}

```
2. fullName
3. dateOfBirth
4. parole - priekšgalā jāhasho tā, lai parole = sha512(sniegtā_parole + salt)
5. salt - arī tiek ģenerēts tā kā key
6. lietotajvards
7. epasts
8. telefonanumurs

Vēl var norādīt:

9. komandasNosaukums
10. role

### globāli pārskatīt to, kas pārsaukts un refaktorēts

Piemēram:

	`/api/unverified-accounts` nevis `/api/account-applications`
	
	`/api/verify-account/{key}` nevis `/api/verify-account-application/{key}`
	
Un to atgrieztos rezultātus un prasības, tā kā rakstīts `openapi.yaml`.

## Aizmugurgalam

1. salabot e-pastu saglabāšanu - datu struktūru TeamMember papildināt
2. un sarakstīt handler funkcijas

3. salabot slīpsvītras/http encoding "net/url.QueryUnescape()"

4. tukša komandas nosaukuma neļaušana

5. epastu validācija

