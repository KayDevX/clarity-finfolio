;; FinFolio - Gamified Finance Tracker

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u101))
(define-constant err-goal-exists (err u102))
(define-constant err-invalid-amount (err u103))

;; Data Variables 
(define-data-var tip-count uint u0)
(define-data-var total-rewards uint u0)

;; Constants for rewards and caps
(define-constant DAILY-BONUS uint u10)
(define-constant STREAK-BONUS uint u5) 
(define-constant GOAL-COMPLETE-BONUS uint u50)
(define-constant MAX-STREAK uint u30) ;; Cap streak bonus at 30 days
(define-constant MAX-DAILY-POINTS uint u100) ;; Cap daily points at 100

;; [Rest of the maps and other constants remain unchanged...]

(define-public (claim-daily-rewards)
    (let (
        (rewards (default-to {
            points: u0,
            streak: u0,
            last-active: u0,
            badges: (list)
        } (map-get? UserRewards tx-sender)))
        (streak-points (if (>= (get streak rewards) MAX-STREAK)
            (* MAX-STREAK STREAK-BONUS)
            (* (get streak rewards) STREAK-BONUS)))
        (total-daily-points (+ DAILY-BONUS streak-points))
        (capped-points (if (> total-daily-points MAX-DAILY-POINTS)
            MAX-DAILY-POINTS
            total-daily-points))
    )
        (begin
            (update-streak tx-sender)
            (var-set total-rewards (+ (var-get total-rewards) capped-points))
            (ok (map-set UserRewards tx-sender (merge rewards {
                points: (+ (get points rewards) capped-points)
            }))))))

;; [Rest of the contract remains unchanged...]
