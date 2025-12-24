import React, { useState } from 'react';
import { ChevronLeft, CreditCard } from 'lucide-react';
import { Hotel, BookingDetails } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface CheckoutPageProps {
  hotel: Hotel;
  bookingDetails: BookingDetails;
  onBack: () => void;
  onConfirm: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ hotel, bookingDetails, onBack, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  // Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s/g, ''); // Remove spaces
    if (val === '' || /^\d+$/.test(val)) {
      if (val.length <= 16) {
        // Format with spaces every 4 digits
        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        setCardNumber(formatted);
      }
    }
  };

  const handleNumberChange = (setter: (val: string) => void, maxLength: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      if (val.length <= maxLength) setter(val);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if ((val === '' || /^[a-zA-Z\s]+$/.test(val)) && val.length <= 40) {
      setCardHolder(val);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (!/^[0-9/]*$/.test(newValue)) return;

    if (newValue.length < expiry.length) {
      setExpiry(newValue);
      return;
    }

    const clean = newValue.replace(/\//g, '');

    // Validate month (first 2 digits)
    if (clean.length >= 2) {
      const month = parseInt(clean.slice(0, 2));
      if (month > 12 || month === 0) return; // Prevent invalid months
      newValue = clean.slice(0, 2) + '/' + clean.slice(2);
    }

    if (newValue.length <= 5) {
      setExpiry(newValue);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Import payment service
      const { paymentService } = await import('../services/paymentService');
      const { reservationService } = await import('../services/reservationService');

      // First create the reservation
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user._id || user.id; // Handle both _id and id formats

      if (!userId) {
        alert('User not logged in. Please log in and try again.');
        setLoading(false);
        return;
      }

      const reservationData = {
        user_id: userId,
        listing_id: hotel.id,
        start_date: bookingDetails.checkIn,
        end_date: bookingDetails.checkOut,
        guests: bookingDetails.guestCount,
        total_price: bookingDetails.total + 350, // Including cleaning fee
      };

      console.log('Creating reservation with data:', reservationData);
      const reservation = await reservationService.createReservation(reservationData);

      // Process payment
      const paymentData = {
        card_number: cardNumber.replace(/\s/g, ''), // Remove spaces before sending
        card_holder: cardHolder,
        expiry: expiry,
        cvv: cvv,
        reservation_id: reservation._id,
        amount: bookingDetails.total + 350,
      };

      console.log('Processing payment with data:', paymentData);
      const paymentResult = await paymentService.processPayment(paymentData);

      // Update reservation status to 'pending' after successful payment
      const reservationId = typeof reservation._id === 'string'
        ? reservation._id
        : reservation._id.$oid;

      await reservationService.updateReservation(reservationId, {
        status: 'pending'
      });

      console.log('Payment successful:', paymentResult);
      setLoading(false);
      onConfirm();
    } catch (error: any) {
      setLoading(false);
      console.error('Payment failed:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(error.response?.data?.error || 'Payment failed. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft />
        </button>
        <h1 className="text-3xl font-bold">Request to book</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Your trip</h2>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium">Dates</div>
                <div className="text-gray-600">
                  {formatDate(bookingDetails.checkIn)} – {formatDate(bookingDetails.checkOut)}
                </div>
              </div>
              <button className="font-medium underline text-gray-800" onClick={onBack}>Edit</button>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium">Guests</div>
                <div className="text-gray-600">{bookingDetails.guestCount} guest{bookingDetails.guestCount > 1 ? 's' : ''}</div>
              </div>
              <button className="font-medium underline text-gray-800" onClick={onBack}>Edit</button>
            </div>
          </section>


          <section>
            <h2 className="text-xl font-semibold mb-6">Pay with Card</h2>
            <div className="w-full h-56 mb-8 perspective-1000 group">
              <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* FRONT of Card */}
                <div className="absolute w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl backface-hidden flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <CreditCard size={32} className="text-amber-500" />
                    <span className="text-xs font-mono opacity-70">CREDIT CARD</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-mono tracking-widest mb-4">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[10px] uppercase opacity-70 mb-1">Card Holder</div>
                        <div className="font-mono uppercase tracking-wider text-sm">{cardHolder || 'FULL NAME'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase opacity-70 mb-1">Expires</div>
                        <div className="font-mono text-sm">{expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BACK of Card */}
                <div className="absolute w-full h-full bg-gradient-to-bl from-gray-800 to-gray-900 rounded-2xl text-white shadow-xl rotate-y-180 backface-hidden overflow-hidden">
                  <div className="w-full h-10 bg-black mt-6 opacity-80"></div>
                  <div className="p-6 mt-2">
                    <div className="flex flex-col items-end">
                      <div className="text-xs uppercase mr-2 mb-1">CVV</div>
                      <div className="w-full bg-white h-10 rounded text-black font-mono flex items-center justify-end px-3 tracking-widest">
                        {cvv || '***'}
                      </div>
                    </div>
                    <div className="mt-8 flex items-center justify-center opacity-50">
                      <CreditCard size={48} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Card Number"
                value={cardNumber}
                onChange={handleCardNumberChange}
                onFocus={() => setIsFlipped(false)}
                maxLength={19}
              />
              <Input
                placeholder="Card Holder Name"
                value={cardHolder}
                onChange={handleNameChange}
                onFocus={() => setIsFlipped(false)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  onFocus={() => setIsFlipped(false)}
                  maxLength={5}
                />
                <Input
                  placeholder="CVV"
                  value={cvv}
                  onChange={handleNumberChange(setCvv, 3)}
                  onFocus={() => setIsFlipped(true)} // FLIP: Shows Back
                  onBlur={() => setIsFlipped(false)} // FLIP: Returns to Front
                  maxLength={3}
                />
              </div>
            </div>
          </section>

          <Button
            variant="primary"
            className="w-full py-4 text-lg font-bold bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handlePayment}
            disabled={loading || !cardNumber || !cvv || !cardHolder || !expiry}
          >
            {loading ? "Processing..." : "Confirm and pay"}
          </Button>
        </div>

        {/* Price Details */}
        <div className="hidden md:block">
          <div className="border border-gray-200 rounded-xl p-6 shadow-lg sticky top-24 bg-white">
            <div className="flex gap-4 mb-6 border-b pb-6">
              <img src={hotel.images[0]} className="w-28 h-24 object-cover rounded-lg" alt="Thumbnail" />
              <div>
                <div className="text-xs text-gray-500 mb-1">{hotel.property_type}</div>
                <div className="font-medium text-sm mb-2 line-clamp-2">{hotel.title}</div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="font-bold text-black">{hotel.rating}</span>
                  <span>({hotel.reviews} reviews)</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 pb-4 border-b">
              <div className="flex justify-between text-gray-600">
                <span>₺{hotel.price} x {bookingDetails.guestCount} guests</span>
                <span>₺{bookingDetails.total}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cleaning fee</span>
                <span>₺350</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg pt-4">
              <span>Total (TRY)</span>
              <span>₺{bookingDetails.total + 350}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};