const countDownDate = new Date("Sep 13, 2025 13:00:00").getTime();

const timer = document.getElementById("timer");

  const countdownFunction = setInterval(function () {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    if (distance < 0) {
      clearInterval(countdownFunction);
      timer.innerHTML = "Srećno!";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Formatiraj da uvek bude dvoznamenkasto
    const format = (n) => (n < 10 ? "0" + n : n);

    timer.innerHTML = `${format(days)} : ${format(hours)} : ${format(minutes)} : ${format(seconds)}`;
  }, 1000);

