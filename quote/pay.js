/* ------------------------------------------------------------------
   DEPOSIT PAYMENT DETAILS
   Shown to the client only after they have signed their quote.
   Type your details between the quote marks and save the file.
   Leave anything blank ("") and that part simply will not appear.
   ------------------------------------------------------------------ */
var RA_PAY = {
  accountName:   "",   // name on the bank account, e.g. "C Collins"
  bankName:      "",   // e.g. "Starling Bank"
  sortCode:      "",   // e.g. "00-00-00"
  accountNumber: "",   // 8 digits
  cardLink:      ""    // leave blank: the Stripe deposit link is already built into the quote page
};
