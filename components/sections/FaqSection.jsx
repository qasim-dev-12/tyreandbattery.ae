export default function FaqSection({ faqs }) {
  if (faqs.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Frequently Asked Questions</h2>
      <div className="mt-6 flex flex-col divide-y divide-dark/10 rounded-xl border border-dark/10 bg-white">
        {faqs.map((faq) => (
          <div key={faq.question} className="p-5">
            <p className="font-semibold text-dark">{faq.question}</p>
            <p className="mt-1 text-sm text-dark/60">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
