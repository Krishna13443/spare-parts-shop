const mockAdmins = new Map([
  ['admin@spareparts.com', 'admin123'],
  ['admin', 'krishna1110'],
  ['9080799320', 'krishna1110'],
  ['college1110kj@gmail.com', 'krishna1110']
]);

module.exports = {
  // Store a numeric passcode for a phone number
  setPasscode: (phone, passcode) => mockAdmins.set(phone, passcode),
  // Get the stored passcode
  getPasscode: (phone) => mockAdmins.get(phone),
  // Check if we have an override for this user
  hasOverride: (phone) => mockAdmins.has(phone)
};
