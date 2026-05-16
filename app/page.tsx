const submitDeposit = async () => {
  if (!amount || !utr) {
    alert("Enter amount and UTR");
    return;
  }

  try {
    await addDoc(collection(db, "deposits"), {
      name: "Sanghavi",
      amount: Number(amount),
      utr: utr,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    alert("Deposit Request Sent ✅");

    setAmount("");
    setUtr("");
    setShowAdd(false);
  } catch (error) {
    console.log(error);
    alert("Error");
  }
};