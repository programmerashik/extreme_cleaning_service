  
        // Price calculation variables
        let basePrice = 50;
        let bathroomPrice = 15;
        let packagePrice = 20;
        let serviceModePrice = 0;
        let addonsPrice = 0;
        let hourlyRate = 25;
        let isHourly = false;

        // DOM elements
        const estimatedPriceElement = document.getElementById('estimatedPrice');
        const hourlyBasedRadio = document.getElementById('hourlyBased');
        const fixedPriceRadio = document.getElementById('fixedPrice');

        // Property type selection
        const propertyOptions = document.querySelectorAll('.property-option');
        let selectedProperty = "Studio / 1 Bedroom";

        // Initialize property options
        propertyOptions.forEach(option => {
            option.addEventListener('click', function () {
                propertyOptions.forEach(opt => {
                    opt.querySelector('.checkmark').textContent = '';
                    opt.classList.remove('selected');
                });

                this.querySelector('.checkmark').textContent = '✓';
                this.classList.add('selected');
                selectedProperty = this.getAttribute('data-value');
                basePrice = parseInt(this.getAttribute('data-price'));
                updatePrice();
            });
        });

        // Set first option as selected by default
        if (propertyOptions.length > 0) {
            propertyOptions[0].classList.add('selected');
        }

        // Bathroom selection
        document.querySelectorAll('input[name="bathroom"]').forEach(radio => {
            radio.addEventListener('change', function () {
                bathroomPrice = parseInt(this.getAttribute('data-price'));
                updatePrice();
            });
        });

        // Add-ons selection
        document.querySelectorAll('input[name="addons"]').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                updatePrice();
            });
        });

        // Service mode selection
        document.querySelectorAll('input[name="serviceMode"]').forEach(radio => {
            radio.addEventListener('change', function () {
                serviceModePrice = parseInt(this.getAttribute('data-price'));
                isHourly = this.id === 'hourlyBased';
                updatePrice();
            });
        });

        // Package type selection
        document.querySelectorAll('input[name="packageType"]').forEach(radio => {
            radio.addEventListener('change', function () {
                packagePrice = parseInt(this.getAttribute('data-price'));
                updatePrice();
            });
        });

        // Function to update the price display
        function updatePrice() {
            addonsPrice = 0;
            document.querySelectorAll('input[name="addons"]:checked').forEach(checkbox => {
                addonsPrice += parseInt(checkbox.getAttribute('data-price'));
            });

            let totalPrice;
            if (isHourly) {
                const hourlyMinimum = hourlyRate;
                const additionalCharges = bathroomPrice + packagePrice + addonsPrice;
                totalPrice = hourlyMinimum + additionalCharges;
                estimatedPriceElement.textContent = `ESTIMATED PRICE €${totalPrice} (€${hourlyRate}/hour + €${additionalCharges} additional charges)`;
            } else {
                totalPrice = basePrice + bathroomPrice + packagePrice + addonsPrice;
                estimatedPriceElement.textContent = `ESTIMATED PRICE €${totalPrice}`;
            }
        }

        // Form submission with enhanced error handling
        document.getElementById('bookingForm').addEventListener('submit', async function (e) {
            e.preventDefault();

            try {
                console.log('Starting form submission process...');

                // Get form values with null checks
                const getCheckedValue = (name) => {
                    const el = document.querySelector(`input[name="${name}"]:checked`);
                    return el ? el.value : 'Not selected';
                };

                const serviceMode = getCheckedValue('serviceMode');
                const packageType = getCheckedValue('packageType');
                const bathroom = getCheckedValue('bathroom');

                // Get selected add-ons
                const addons = [];
                document.querySelectorAll('input[name="addons"]:checked').forEach(checkbox => {
                    addons.push(checkbox.value);
                });

                // Get other form values
                const getValue = (id) => {
                    const el = document.getElementById(id);
                    return el ? el.value : 'Not provided';
                };

                const formData = {
                    serviceMode,
                    packageType,
                    propertyType: selectedProperty,
                    bathroom,
                    addons: addons.join(', ') || 'None',
                    date: getValue('date'),
                    dateTime: getValue('dateTime'),
                    address: getValue('address'),
                    extraComment: getValue('extraComment'),
                    name: getValue('name'),
                    phone: getValue('phone'),
                    email: getValue('email')
                };

                // Calculate final price
                let additionalCharges = bathroomPrice + packagePrice + addonsPrice;
                let finalPrice = isHourly ? (hourlyRate + additionalCharges) : (basePrice + additionalCharges);

                let priceMessage = isHourly
                    ? `Hourly Rate: €${hourlyRate}/hour (minimum 1 hour)\nAdditional Charges: €${additionalCharges}\nEstimated Total: €${finalPrice}`
                    : `Total Price: €${finalPrice}`;

                // Create WhatsApp message
                let message = `*New Cleaning Booking Request*\n\n` +
                    `*Service Mode:* ${formData.serviceMode}\n` +
                    `*Package Type:* ${formData.packageType}\n` +
                    `*Property Type:* ${formData.propertyType}\n` +
                    `*Bathroom Cleaning:* ${formData.bathroom}\n` +
                    `*Add-ons:* ${formData.addons}\n` +
                    `*Date:* ${formData.date}\n` +
                    `*Preferred Time:* ${formData.dateTime}\n` +
                    `*Address:* ${formData.address}\n` +
                    `*Special Instructions:* ${formData.extraComment}\n\n` +
                    `*Client Information*\n` +
                    `Name: ${formData.name}\n` +
                    `Phone: ${formData.phone}\n` +
                    `Email: ${formData.email}\n\n` +
                    `*${priceMessage}*`;

                // Encode message for URL
                const encodedMessage = encodeURIComponent(message);
                const whatsappNumber = '+8801861677258'; // Replace with your number
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

                console.log('Generated WhatsApp URL:', whatsappUrl);

                // Open WhatsApp in a new tab
                const newWindow = window.open(whatsappUrl, '_blank');
                if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                    throw new Error('Popup window was blocked. Please allow popups for this site.');
                }

                // Send data to Google Sheets
                const sheetsData = {
                    ...formData,
                    priceDetails: priceMessage,
                    totalPrice: finalPrice,
                    timestamp: new Date().toLocaleString()
                };

                const sheetsSuccess = await sendToGoogleSheets(sheetsData);
                if (!sheetsSuccess) {
                    console.warn('Data might not have been saved to Google Sheets');
                }

                // Optional: Show success message to user
                alert('Booking request sent successfully! We will contact you shortly.');

            } catch (error) {
                console.error('Error during form submission:', error);
                alert(`Error: ${error.message}\nPlease contact us directly at +8801861677258`);
            }
        });

        // Improved Google Sheets submission function
        async function sendToGoogleSheets(formData) {
            const scriptURL = 'https://script.google.com/macros/s/AKfycbxdccwqq3bxYthconTlGlzvqF9PT8R_FYF4FdO4A4eyRNzqJhlA36mklWRDIT8YyrePuQ/exec';

            try {
                console.log('Sending data to Google Sheets:', formData);

                const response = await fetch(scriptURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Google Sheets response:', result);

                if (result.status === "success") {
                    return true;
                } else {
                    throw new Error(result.message || 'Unknown server error');
                }
            } catch (error) {
                console.error('Error sending to Google Sheets:', error);
                return false;
            }
        }

        // Mobile Menu Toggle
        const mobileMenu = document.querySelector('.mobile-menu');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenu && navLinks) {
            mobileMenu.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                mobileMenu.innerHTML = navLinks.classList.contains('active')
                    ? '<i class="fas fa-times"></i>'
                    : '<i class="fas fa-bars"></i>';
            });
        }

        // FAQ Accordion
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                answer.classList.toggle('active');

                const icon = question.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        });

        // Smooth Scrolling for Anchor Links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();

                if (this.getAttribute('href') === '#') return;

                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if open
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        mobileMenu.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            });
        });

        // Sticky Header on Scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (header) {
                header.classList.toggle('sticky', window.scrollY > 0);
            }
        });
    