<?php

// Where the clinic's clock is. A doctor's hours ("9 to 5") and the appointment
// slots cut from them are wall-clock times in this zone, whatever the app
// timezone (UTC) or the patient's phone says — a 09:00 slot is 09:00 at the
// clinic, everywhere it is shown.
return [
    'timezone' => env('CLINIC_TIMEZONE', 'Asia/Karachi'),
];
