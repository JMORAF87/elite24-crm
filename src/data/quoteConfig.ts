export const quoteConfig = {
    companyContext: {
        name: "Elite 24 Security",
        website: "https://www.elite24security.com/",
        phone: "",
        email: "sales@elite24.com",
        cities: ["Amarillo, TX"]
    },
    rates: {
        constructionSite: {
            unarmed: 25,
            armed: 35,
            patrol: 45
        },
        commercialProperty: {
            unarmed: 23,
            armed: 33,
            patrol: 40
        }
    },
    formulas: {
        monthlyEstimate: "hourlyRate * hoursPerWeek * 4.33"
    },
    notes: {
        constructionSite: "Used for GCs and large construction projects with active sites, materials, and equipment.",
        commercialProperty: "Used for property managers and CRE for offices, retail, and mixed-use sites."
    }
};

export type ServiceType = keyof typeof quoteConfig.rates;
export type GuardType = 'unarmed' | 'armed' | 'patrol';
