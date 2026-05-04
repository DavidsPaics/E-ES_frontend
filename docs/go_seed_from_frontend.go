package db

import (
	"context"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/ksvaza/ees-link/models"
)

func SeedTestData(ctx context.Context) error {
	realDB := &RealDB{}

	if err := seedApplications(ctx, realDB); err != nil {
		return fmt.Errorf("seed applications: %w", err)
	}
	if err := seedAccounts(ctx, realDB); err != nil {
		return fmt.Errorf("seed accounts: %w", err)
	}
	if err := seedAdmins(ctx, realDB); err != nil {
		return fmt.Errorf("seed admins: %w", err)
	}
	if err := seedAccountApplications(ctx, realDB); err != nil {
		return fmt.Errorf("seed account applications: %w", err)
	}

	return nil
}

func DeleteSeedData(ctx context.Context) error {
	if err := DeleteAllApplications(ctx); err != nil {
		return fmt.Errorf("delete applications: %w", err)
	}
	if err := DeleteAllAccounts(ctx); err != nil {
		return fmt.Errorf("delete accounts: %w", err)
	}
	if err := DeleteAllAdmins(ctx); err != nil {
		return fmt.Errorf("delete admins: %w", err)
	}
	if err := DeleteAllAccountApplications(ctx); err != nil {
		return fmt.Errorf("delete account applications: %w", err)
	}

	return nil
}

func DeleteAllApplications(ctx context.Context) error {
	_, err := Pool.Exec(ctx, "DELETE FROM applicants")
	return err
}

func DeleteAllAccounts(ctx context.Context) error {
	_, err := Pool.Exec(ctx, "DELETE FROM konti")
	return err
}

func DeleteAllAdmins(ctx context.Context) error {
	_, err := Pool.Exec(ctx, "DELETE FROM admini")
	return err
}

func DeleteAllAccountApplications(ctx context.Context) error {
	_, err := Pool.Exec(ctx, "DELETE FROM kontu_pieteikumi")
	return err
}

func seedHash(password, salt string) string {
	h := sha512.New()
	h.Write([]byte(password + salt))
	return hex.EncodeToString(h.Sum(nil))
}

func mustSeedTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		panic(err)
	}
	return parsed.UTC()
}

func stringPtr(value string) *string {
	return &value
}

func seedApplications(ctx context.Context, realDB *RealDB) error {
	applications := []models.RegistrationFormData{
		{
			ID:           "team-voltfalcons",
			TeamName:     "Volt Falcons",
			AgeGroup:     "U16",
			Institution:  stringPtr("Riga State Gymnasium No. 1"),
			CityOrRegion: "Riga",
			Members: []models.TeamMember{
				{
					Key:                    "voltfalcons-pilot",
					FullName:               "Markuss Berzins",
					DateOfBirth:            "2011-04-02",
					EducationalInstitution: "Riga State Gymnasium No. 1",
					Phone:                  "+371 22000001",
					Email:                  "markuss.berzins@example.com",
					Role:                   "pilot",
					ClassOrYear:            "Grade 9",
					ID:                     "team-voltfalcons",
				},
				{
					Key:                    "voltfalcons-reserve",
					FullName:               "Anna Liepa",
					DateOfBirth:            "2011-08-19",
					EducationalInstitution: "Riga State Gymnasium No. 1",
					Phone:                  "+371 22000002",
					Email:                  "anna.liepa@example.com",
					Role:                   "reserve_pilot",
					ClassOrYear:            "Grade 9",
					ID:                     "team-voltfalcons",
				},
				{
					Key:                    "voltfalcons-leader",
					FullName:               "Rihards Ozols",
					DateOfBirth:            "2011-01-13",
					EducationalInstitution: "Riga State Gymnasium No. 1",
					Phone:                  "+371 22000003",
					Email:                  "rihards.ozols@example.com",
					Role:                   "team_leader",
					ClassOrYear:            "Grade 9",
					ID:                     "team-voltfalcons",
				},
				{
					Key:                    "voltfalcons-participant",
					FullName:               "Liene Krumina",
					DateOfBirth:            "2012-11-05",
					EducationalInstitution: "Riga State Gymnasium No. 1",
					Phone:                  "+371 22000004",
					Email:                  "liene.krumina@example.com",
					Role:                   "participant",
					ClassOrYear:            "Grade 8",
					ID:                     "team-voltfalcons",
				},
			},
			ResponsiblePerson: models.ResponsiblePerson{
				FullName: "Ilze Ozola",
				Phone:    "+371 20001001",
				Email:    "coach@voltfalcons.lv",
				Status:   "Supervisor",
			},
			HowHeardAbout:   stringPtr("School STEM club"),
			Comments:        stringPtr("We can bring our own tools and charger."),
			ConfirmTruthful: true,
			ConfirmRules:    true,
			ConfirmMedia:    true,
			AppliedAt:       mustSeedTime("2026-03-26T14:35:00Z"),
			Status:          "pending",
		},
		{
			ID:           "team-ecospark",
			TeamName:     "EcoSpark",
			AgeGroup:     "U25",
			Institution:  stringPtr("Jelgava Technical School"),
			CityOrRegion: "Jelgava",
			Members: []models.TeamMember{
				{
					Key:                    "ecospark-leader",
					FullName:               "Edgars Auzins",
					DateOfBirth:            "2007-03-20",
					EducationalInstitution: "Jelgava Technical School",
					Phone:                  "+371 22000101",
					Email:                  "edgars.auzins@example.com",
					Role:                   "team_leader",
					ClassOrYear:            "Year 2",
					ID:                     "team-ecospark",
				},
				{
					Key:                    "ecospark-pilot",
					FullName:               "Paula Ziedina",
					DateOfBirth:            "2008-07-11",
					EducationalInstitution: "Jelgava Technical School",
					Phone:                  "+371 22000102",
					Email:                  "paula.ziedina@example.com",
					Role:                   "pilot",
					ClassOrYear:            "Year 1",
					ID:                     "team-ecospark",
				},
				{
					Key:                    "ecospark-reserve",
					FullName:               "Niks Berzins",
					DateOfBirth:            "2007-12-03",
					EducationalInstitution: "Jelgava Technical School",
					Phone:                  "+371 22000103",
					Email:                  "niks.berzins@example.com",
					Role:                   "reserve_pilot",
					ClassOrYear:            "Year 2",
					ID:                     "team-ecospark",
				},
				{
					Key:                    "ecospark-participant-1",
					FullName:               "Santa Lapsa",
					DateOfBirth:            "2008-09-14",
					EducationalInstitution: "Jelgava Technical School",
					Phone:                  "+371 22000104",
					Email:                  "santa.lapsa@example.com",
					Role:                   "participant",
					ClassOrYear:            "Year 1",
					ID:                     "team-ecospark",
				},
				{
					Key:                    "ecospark-participant-2",
					FullName:               "Karlis Dreimanis",
					DateOfBirth:            "2006-05-27",
					EducationalInstitution: "Jelgava Technical School",
					Phone:                  "+371 22000105",
					Email:                  "karlis.dreimanis@example.com",
					Role:                   "participant",
					ClassOrYear:            "Year 3",
					ID:                     "team-ecospark",
				},
			},
			ResponsiblePerson: models.ResponsiblePerson{
				FullName: "Janis Stalts",
				Phone:    "+371 20001002",
				Email:    "mentor@ecospark.lv",
				Status:   "Supervisor",
			},
			HowHeardAbout:   stringPtr("Last year's finals"),
			Comments:        nil,
			ConfirmTruthful: true,
			ConfirmRules:    true,
			ConfirmMedia:    true,
			AppliedAt:       mustSeedTime("2026-03-24T09:12:00Z"),
			Status:          "accepted",
		},
		{
			ID:           "team-blue-current",
			TeamName:     "Blue Current",
			AgeGroup:     "U12",
			Institution:  stringPtr("Liepaja Secondary School No. 3"),
			CityOrRegion: "Liepaja",
			Members: []models.TeamMember{
				{
					Key:                    "blue-current-pilot",
					FullName:               "Marta Janse",
					DateOfBirth:            "2014-10-06",
					EducationalInstitution: "Liepaja Secondary School No. 3",
					Phone:                  "+371 22000201",
					Email:                  "marta.janse@example.com",
					Role:                   "pilot",
					ClassOrYear:            "Grade 5",
					ID:                     "team-blue-current",
				},
				{
					Key:                    "blue-current-participant",
					FullName:               "Roberts Gailis",
					DateOfBirth:            "2014-02-22",
					EducationalInstitution: "Liepaja Secondary School No. 3",
					Phone:                  "+371 22000202",
					Email:                  "roberts.gailis@example.com",
					Role:                   "participant",
					ClassOrYear:            "Grade 5",
					ID:                     "team-blue-current",
				},
				{
					Key:                    "blue-current-reserve",
					FullName:               "Laura Upite",
					DateOfBirth:            "2013-04-17",
					EducationalInstitution: "Liepaja Secondary School No. 3",
					Phone:                  "+371 22000203",
					Email:                  "laura.upite@example.com",
					Role:                   "reserve_pilot",
					ClassOrYear:            "Grade 6",
					ID:                     "team-blue-current",
				},
			},
			ResponsiblePerson: models.ResponsiblePerson{
				FullName: "Dace Kalnina",
				Phone:    "+371 20001003",
				Email:    "blue.current@example.com",
				Status:   "Supervisor",
			},
			HowHeardAbout:   stringPtr("Social media"),
			Comments:        stringPtr("Will reapply with complete team composition."),
			ConfirmTruthful: true,
			ConfirmRules:    true,
			ConfirmMedia:    true,
			AppliedAt:       mustSeedTime("2026-03-23T18:47:00Z"),
			Status:          "denied",
		},
	}

	for _, app := range applications {
		existing, err := realDB.GetApplicationByID(ctx, app.ID)
		if err != nil {
			return err
		}
		if existing != nil {
			continue
		}

		if err := realDB.RegisterNewApplication(ctx, app); err != nil {
			return err
		}
	}

	return nil
}

func seedAccounts(ctx context.Context, realDB *RealDB) error {
	const salt = "frontend-seed-salt"

	accounts := []models.Account{
		{
			Cilveks: models.TeamMember{
				Key:                    "voltfalcons-pilot",
				FullName:               "Markuss Berzins",
				DateOfBirth:            "2011-04-02",
				EducationalInstitution: "Riga State Gymnasium No. 1",
				Phone:                  "+371 22000001",
				Email:                  "markuss.berzins@example.com",
				Role:                   "pilot",
				ClassOrYear:            "Grade 9",
				ID:                     "team-voltfalcons",
			},
			Password:    seedHash("participant1", salt),
			Username:    "participant1",
			Email:       "markuss.berzins@example.com",
			PhoneNumber: "+371 22000001",
			Salt:        salt,
		},
		{
			Cilveks: models.TeamMember{
				Key:                    "voltfalcons-reserve",
				FullName:               "Anna Liepa",
				DateOfBirth:            "2011-08-19",
				EducationalInstitution: "Riga State Gymnasium No. 1",
				Phone:                  "+371 22000002",
				Email:                  "anna.liepa@example.com",
				Role:                   "reserve_pilot",
				ClassOrYear:            "Grade 9",
				ID:                     "team-voltfalcons",
			},
			Password:    seedHash("participant2", salt),
			Username:    "participant2",
			Email:       "anna.liepa@example.com",
			PhoneNumber: "+371 22000002",
			Salt:        salt,
		},
		{
			Cilveks: models.TeamMember{
				Key:                    "voltfalcons-leader",
				FullName:               "Rihards Ozols",
				DateOfBirth:            "2011-01-13",
				EducationalInstitution: "Riga State Gymnasium No. 1",
				Phone:                  "+371 22000003",
				Email:                  "rihards.ozols@example.com",
				Role:                   "team_leader",
				ClassOrYear:            "Grade 9",
				ID:                     "team-voltfalcons",
			},
			Password:    seedHash("leader1", salt),
			Username:    "leader1",
			Email:       "rihards.ozols@example.com",
			PhoneNumber: "+371 22000003",
			Salt:        salt,
		},
		{
			Cilveks: models.TeamMember{
				Key:                    "ecospark-leader",
				FullName:               "Edgars Auzins",
				DateOfBirth:            "2007-03-20",
				EducationalInstitution: "Jelgava Technical School",
				Phone:                  "+371 22000101",
				Email:                  "edgars.auzins@example.com",
				Role:                   "team_leader",
				ClassOrYear:            "Year 2",
				ID:                     "team-ecospark",
			},
			Password:    seedHash("leader2", salt),
			Username:    "leader2",
			Email:       "edgars.auzins@example.com",
			PhoneNumber: "+371 22000101",
			Salt:        salt,
		},
		{
			Cilveks: models.TeamMember{
				Key:                    "ecospark-participant-1",
				FullName:               "Santa Lapsa",
				DateOfBirth:            "2008-09-14",
				EducationalInstitution: "Jelgava Technical School",
				Phone:                  "+371 22000104",
				Email:                  "santa.lapsa@example.com",
				Role:                   "participant",
				ClassOrYear:            "Year 1",
				ID:                     "team-ecospark",
			},
			Password:    seedHash("participant3", salt),
			Username:    "participant3",
			Email:       "santa.lapsa@example.com",
			PhoneNumber: "+371 22000104",
			Salt:        salt,
		},
	}

	for _, account := range accounts {
		existing, err := realDB.GetAccountByUsername(ctx, account.Username)
		if err != nil {
			return err
		}
		if existing != nil {
			continue
		}

		if err := realDB.RegisterNewAccount(ctx, account); err != nil {
			return err
		}
	}

	return nil
}

func seedAdmins(ctx context.Context, realDB *RealDB) error {
	const salt = "frontend-admin-seed-salt"

	admins := []models.AdminAccount{
		{
			Username:   "referee1",
			Password:   seedHash("referee1", salt),
			Salt:       salt,
			Superadmin: false,
			Key:        "user-admin",
		},
		{
			Username:   "superadmin",
			Password:   seedHash("superadmin", salt),
			Salt:       salt,
			Superadmin: true,
			Key:        "user-super-admin",
		},
		{
			Username:   "a",
			Password:   seedHash("b", salt),
			Salt:       salt,
			Superadmin: true,
			Key:        "user-legacy-a",
		},
	}

	for _, admin := range admins {
		existing, err := realDB.GetAdminAccountByUsername(ctx, admin.Username)
		if err != nil {
			return err
		}
		if existing != nil {
			continue
		}

		if err := realDB.RegisterNewAdmin(ctx, admin); err != nil {
			return err
		}
	}

	return nil
}

func seedAccountApplications(ctx context.Context, realDB *RealDB) error {
	applications := []models.AccountApplication{
		{
			Key:         "account-application-liene-krumina",
			FullName:    "Liene Krumina",
			DateOfBirth: "2012-11-05",
			Role:        "participant",
			Password:    "liene123",
			Username:    "liene.krumina",
			Email:       "liene.krumina@example.com",
			PhoneNumber: "+371 22000004",
			TeamName:    "Volt Falcons",
		},
		{
			Key:         "account-application-paula-ziedina",
			FullName:    "Paula Ziedina",
			DateOfBirth: "2008-07-11",
			Role:        "pilot",
			Password:    "paula123",
			Username:    "paula.ziedina",
			Email:       "paula.ziedina@example.com",
			PhoneNumber: "+371 22000102",
			TeamName:    "EcoSpark",
		},
		{
			Key:         "account-application-niks-berzins",
			FullName:    "Niks Berzins",
			DateOfBirth: "2007-12-03",
			Role:        "reserve_pilot",
			Password:    "niks123",
			Username:    "niks.berzins",
			Email:       "niks.berzins@example.com",
			PhoneNumber: "+371 22000103",
			TeamName:    "EcoSpark",
		},
	}

	existingApplications, err := realDB.GetAccountApplications(ctx)
	if err != nil {
		return err
	}

	existingUsernames := make(map[string]struct{}, len(existingApplications))
	for _, existing := range existingApplications {
		existingUsernames[existing.Username] = struct{}{}
	}

	for _, application := range applications {
		if _, exists := existingUsernames[application.Username]; exists {
			continue
		}

		if err := realDB.RegisterNewAccountApplication(ctx, application); err != nil {
			return err
		}
	}

	return nil
}
