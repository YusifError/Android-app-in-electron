import React, { useState } from 'react'
import './CreateListModal.css'

export interface CreateListData {
    name: string
    color: string
}

interface CreateListModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (data: CreateListData) => void
}

const DEFAULT_COLOR = '#64B5F6'

const LIST_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#A3A3A3', '#737373', '#64748B',
    '#92400E', '#78350F', '#DB2777', '#4F46E5'
]

const normalizeHexColor = (value: string): string | null => {
    const match = value.trim().match(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)

    if (!match) return null

    let hex = match[1]

    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('')
    }

    return `#${hex.toUpperCase()}`
}

function CreateListModal({
    isOpen,
    onClose,
    onCreate
}: CreateListModalProps): React.JSX.Element | null {

    const [name, setName] = useState('')
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR)
    const [colorCode, setColorCode] = useState(DEFAULT_COLOR)
    const [isPaletteOpen, setIsPaletteOpen] = useState(false)

    const resetForm = (): void => {
        setName('')
        setSelectedColor(DEFAULT_COLOR)
        setColorCode(DEFAULT_COLOR)
        setIsPaletteOpen(false)
    }

    const handleClose = (): void => {
        resetForm()
        onClose()
    }

    // Выбор цвета из палитры
    const handleColorSelect = (color: string): void => {
        setSelectedColor(color)
        setColorCode(color)
        setIsPaletteOpen(false)
    }

    // Ввод собственного HEX-кода
    const handleColorCodeChange = (value: string): void => {
        setColorCode(value)

        const normalizedColor = normalizeHexColor(value)

        if (normalizedColor) {
            setSelectedColor(normalizedColor)
        }
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault()

        const trimmedName = name.trim()
        const normalizedColor = normalizeHexColor(colorCode)

        if (!trimmedName || !normalizedColor) return

        onCreate({
            name: trimmedName,
            color: normalizedColor
        })

        resetForm()
        onClose()
    }

    const isColorValid = normalizeHexColor(colorCode) !== null

    if (!isOpen) return null

    return (
        <div className="create-list-overlay" onClick={handleClose}>
            <section
                className="create-list-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-list-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="create-list-modal__header">
                    <h2 id="create-list-title">Новый список</h2>

                    <button
                        type="button"
                        className="create-list-modal__close"
                        onClick={handleClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* Название списка */}
                    <div className="create-list-modal__field">

                        <input
                            id="list-name"
                            type="text"
                            placeholder="Название списка"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoFocus
                            maxLength={40}
                        />
                    </div>

                    {/* Выбор цвета */}
                    <div className="create-list-modal__field">
                        {/* Кнопка открытия палитры */}
                        <button
                            type="button"
                            className="create-list-modal__palette-toggle"
                            onClick={() => setIsPaletteOpen(prev => !prev)}
                            aria-expanded={isPaletteOpen}
                            aria-controls="list-color-palette"
                        >
                            <span
                                className="create-list-modal__color-preview"
                                style={{ backgroundColor: selectedColor }}
                            />

                            <span>Выбрать цвет</span>

                            <span className="create-list-modal__selected-code">
                                {selectedColor}
                            </span>
                        </button>

                        {/* Палитра */}
                        {isPaletteOpen && (
                            <div
                                id="list-color-palette"
                                className="create-list-modal__colors"
                            >
                                {LIST_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`create-list-modal__color ${selectedColor === color
                                            ? 'create-list-modal__color--selected'
                                            : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleColorSelect(color)}
                                        aria-label={`Выбрать цвет ${color}`}
                                        aria-pressed={selectedColor === color}
                                    >
                                        {selectedColor === color && '✓'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Собственный HEX-код */}
                        <div className="create-list-modal__hex-field">

                            <input
                                id="list-color-code"
                                type="text"
                                placeholder="#FF5733"
                                value={colorCode}
                                onChange={(event) => handleColorCodeChange(event.target.value)}
                                maxLength={7}
                                spellCheck={false}
                                aria-invalid={!isColorValid}
                            />

                            {!isColorValid && (
                                <span className="create-list-modal__color-error">
                                    Некорректный HEX-код
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Кнопки */}
                    <div className="create-list-modal__actions">
                        <button
                            type="button"
                            className="create-list-modal__cancel"
                            onClick={handleClose}
                        >
                            Отмена
                        </button>

                        <button
                            type="submit"
                            className="create-list-modal__submit"
                            disabled={!name.trim() || !isColorValid}
                        >
                            Создать
                        </button>
                    </div>

                </form>
            </section>
        </div>
    )
}

export default CreateListModal
