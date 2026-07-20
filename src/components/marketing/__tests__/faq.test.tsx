/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Faq } from '../faq';
import { LocaleProvider } from '@/i18n/locale-provider';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

function renderFaq() {
  return render(
    <LocaleProvider initialLocale="en">
      <Faq />
    </LocaleProvider>,
  );
}

describe('Faq accordion', () => {
  it('opens the first question by default', () => {
    renderFaq();
    expect(
      screen.getByText(/No\. SignalForge surfaces technical-analysis signals/),
    ).toBeInTheDocument();
  });

  it('opens the second question when clicked, and shows its answer', () => {
    renderFaq();
    const secondQuestion = screen.getByText('How is the confidence score calculated?');
    fireEvent.click(secondQuestion);

    expect(screen.getByText(/The engine weighs how many indicators agree/)).toBeInTheDocument();
  });

  it('closes the first answer when the second question is opened (single-open accordion)', () => {
    renderFaq();
    const secondQuestion = screen.getByText('How is the confidence score calculated?');
    fireEvent.click(secondQuestion);

    expect(
      screen.queryByText(/No\. SignalForge surfaces technical-analysis signals/),
    ).not.toBeInTheDocument();
  });

  it('lets every question in sequence be opened and show its own answer', () => {
    renderFaq();
    const questions = [
      {
        q: 'What is the Pocket Option ID for?',
        aFragment: /Submitting your Pocket Option account ID/,
      },
      {
        q: 'Which markets does SignalForge cover?',
        aFragment: /Major, minor, and exotic Forex pairs/,
      },
      { q: 'Can I cancel anytime?', aFragment: /Pro and Elite are month-to-month/ },
    ];

    for (const { q, aFragment } of questions) {
      fireEvent.click(screen.getByText(q));
      expect(screen.getByText(aFragment)).toBeInTheDocument();
    }
  });

  it('closes an open question when clicked again', () => {
    renderFaq();
    const first = screen.getByText('Is this financial advice?');
    fireEvent.click(first); // it's open by default, so this closes it
    expect(
      screen.queryByText(/No\. SignalForge surfaces technical-analysis signals/),
    ).not.toBeInTheDocument();
  });

  it('renders correctly in Russian, with the same click-to-open behavior', () => {
    render(
      <LocaleProvider initialLocale="ru">
        <Faq />
      </LocaleProvider>,
    );

    // First question open by default, in Russian
    expect(screen.getByText('Это финансовая рекомендация?')).toBeInTheDocument();
    expect(
      screen.getByText(/Нет\. SignalForge показывает сигналы технического анализа/),
    ).toBeInTheDocument();

    // Click the second question — same bug this test file originally verified, now in Russian too
    fireEvent.click(screen.getByText('Как считается уровень уверенности?'));
    expect(screen.getByText(/Движок учитывает, сколько индикаторов совпадает/)).toBeInTheDocument();
  });
});
