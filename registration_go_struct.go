package models

import "time"

// AgeGroup type
type AgeGroup string

const (
	AgeGroupU12    AgeGroup = "U12"
	AgeGroupU16    AgeGroup = "U16"
	AgeGroupU25    AgeGroup = "U25"
	AgeGroupTautas AgeGroup = "tautas"
)

// MemberRole type
type MemberRole string

const (
	RoleParticipant    MemberRole = "participant"
	RoleTeamLeader     MemberRole = "team_leader"
	RolePilot          MemberRole = "pilot"
	RoleReservePilot   MemberRole = "reserve_pilot"
)

// TeamMember represents a team member in the registration
type TeamMember struct {
	Key                    string     `json:"key"`
	FullName               string     `json:"fullName"`
	DateOfBirth            string     `json:"dateOfBirth"` // ISO date: YYYY-MM-DD
	EducationalInstitution string     `json:"educationalInstitution"`
	Phone                  string     `json:"phone"`
	Email                  string     `json:"email"`
	Role                   MemberRole `json:"role"`
	ClassOrYear            *string    `json:"classOrYear,omitempty"`
}

// ResponsiblePerson represents the responsible person for the team
type ResponsiblePerson struct {
	FullName string `json:"fullName"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Status   string `json:"status"` // teacher, parent, guardian, professor, etc.
}

// RegistrationFormData represents the complete registration form submission
type RegistrationFormData struct {
	// Section 1: General team info
	TeamName     string     `json:"teamName"`
	AgeGroup     AgeGroup   `json:"ageGroup"`
	Institution  *string    `json:"institution,omitempty"`
	CityOrRegion string     `json:"cityOrRegion"`

	// Section 2: Team members
	Members []TeamMember `json:"members"`

	// Section 3: Responsible person
	ResponsiblePerson ResponsiblePerson `json:"responsiblePerson"`

	// Section 4: Additional info
	HowHeardAbout *string `json:"howHeardAbout,omitempty"`
	Comments      *string `json:"comments,omitempty"`

	// Section 5: Confirmations
	ConfirmTruthful bool `json:"confirmTruthful"`
	ConfirmRules    bool `json:"confirmRules"`
	ConfirmMedia    bool `json:"confirmMedia"`

	// Optional: server-side metadata
	SubmittedAt *time.Time `json:"submittedAt,omitempty"`
	ID          *string    `json:"id,omitempty"`
	Status      *string    `json:"status,omitempty"` // "accepted", "denied", "in_process"
}

// Handler example for receiving the registration form
/*
func HandleApplicationSubmission(w http.ResponseWriter, r *http.Request) {
	var formData RegistrationFormData
	
	if err := json.NewDecoder(r.Body).Decode(&formData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate on backend
	if err := validateRegistration(&formData); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Save to database
	// ...

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Application submitted successfully"})
}
*/
