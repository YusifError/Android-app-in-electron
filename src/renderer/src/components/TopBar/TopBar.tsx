
import { useState } from 'react'
import './TopBar.css'

function TopBar(): React.JSX.Element {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [reportText, setReportText] = useState('')

    const handleReportSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault()

        // Пока только проверяем форму.
        // Позже здесь подключим настоящую отправку отчёта.
        alert('Форма работает! Отправка отчётов пока не подключена.')

        setReportText('')
        setIsReportOpen(false)
    }

    return (
        <>
            <header className="topbar">
                <div className="topbar__brand">
                    <div className="topbar__logo">Taskk</div>
                    <span className="topbar__title">My App</span>
                </div>

                <div className="topbar__actions">
                    <div className="topbar__dropdown">
                        <button
                            className="topbar__button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-expanded={isMenuOpen}
                        >
                            Меню
                            <span className="topbar__arrow">
                                {isMenuOpen ? '▲' : '▼'}
                            </span>
                        </button>

                        {isMenuOpen && (
                            <div className="topbar__menu">
                                <button
                                    className="topbar__menu-item"
                                    onClick={() => {
                                        setIsMenuOpen(false)
                                        alert('Моё приложение')
                                    }}
                                >
                                    О приложении
                                </button>

                                <button
                                    className="topbar__menu-item"
                                    onClick={() => {
                                        setIsMenuOpen(false)
                                        setIsReportOpen(true)
                                    }}
                                >
                                    Сообщить об ошибке
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className="topbar__button topbar__report"
                        onClick={() => setIsReportOpen(true)}
                    >
                        <span aria-hidden="true">⚠</span>
                        <span>Сообщить об ошибке</span>
                    </button>

                    <button
                        className="topbar__icon-button"
                        aria-label="Настройки"
                        title="Настройки"
                        onClick={() => alert('Настройки пока не добавлены')}
                    >
                        ⚙
                    </button>
                </div>
            </header>

            {isReportOpen && (
                <div
                    className="topbar__overlay"
                    onClick={() => setIsReportOpen(false)}
                >
                    <section
                        className="topbar__modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="topbar__modal-header">
                            <h2 id="report-title">Сообщить об ошибке</h2>

                            <button
                                className="topbar__close"
                                aria-label="Закрыть"
                                onClick={() => setIsReportOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <p>Опиши, что произошло и как повторить ошибку.</p>

                        <form onSubmit={handleReportSubmit}>
                            <textarea
                                value={reportText}
                                onChange={(event) => setReportText(event.target.value)}
                                placeholder="Напиши здесь..."
                                required
                                rows={5}
                            />

                            <button
                                className="topbar__button topbar__submit"
                                type="submit"
                            >
                                Отправить отчёт
                            </button>
                        </form>

                        <p className="topbar__note">
                            Сейчас это демонстрационная форма — отправка ещё не подключена.
                        </p>
                    </section>
                </div>
            )}
        </>
    )
}

export default TopBar
