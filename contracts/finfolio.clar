;; FinFolio - Gamified Finance Tracker

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u101))
(define-constant err-goal-exists (err u102))
(define-constant err-invalid-amount (err u103))

;; Data Variables
(define-data-var tip-count uint u0)

;; Data Maps
(define-map UserGoals principal (list 10 {
    goal-id: uint,
    target: uint,
    current: uint,
    deadline: uint,
    completed: bool
}))

(define-map UserAchievements principal (list 10 uint))

(define-map FinancialTips uint {
    content: (string-utf8 500),
    category: (string-ascii 20)
})

(define-map LeaderboardScores principal uint)

;; Private Functions
(define-private (calculate-achievement-points (current uint) (target uint))
    (let ((percentage (* (/ current target) u100)))
        (if (>= percentage u100)
            u100
            percentage)))

;; Public Functions
(define-public (create-savings-goal (target uint) (deadline uint))
    (let ((existing-goals (default-to (list) (map-get? UserGoals tx-sender))))
        (if (>= (len existing-goals) u10)
            (err u104)
            (ok (map-set UserGoals 
                tx-sender
                (append existing-goals 
                    {
                        goal-id: (len existing-goals),
                        target: target,
                        current: u0,
                        deadline: deadline,
                        completed: false
                    }))))))

(define-public (update-goal-progress (goal-id uint) (amount uint))
    (let (
        (user-goals (unwrap! (map-get? UserGoals tx-sender) (err u105)))
        (goal (unwrap! (element-at user-goals goal-id) (err u106)))
    )
        (if (> (+ (get current goal) amount) (get target goal))
            err-invalid-amount
            (let ((updated-goal (merge goal { current: (+ (get current goal) amount)})))
                (ok (map-set UserGoals
                    tx-sender
                    (replace-at user-goals goal-id updated-goal)))))))

(define-public (add-financial-tip (content (string-utf8 500)) (category (string-ascii 20)))
    (if (is-eq tx-sender contract-owner)
        (let ((current-count (var-get tip-count)))
            (begin
                (map-set FinancialTips current-count
                    {
                        content: content,
                        category: category
                    })
                (var-set tip-count (+ current-count u1))
                (ok true)))
        err-owner-only))

(define-public (update-leaderboard-score (points uint))
    (let ((current-score (default-to u0 (map-get? LeaderboardScores tx-sender))))
        (ok (map-set LeaderboardScores tx-sender (+ current-score points)))))

;; Read Only Functions
(define-read-only (get-user-goals (user principal))
    (ok (default-to (list) (map-get? UserGoals user))))

(define-read-only (get-user-achievements (user principal))
    (ok (default-to (list) (map-get? UserAchievements user))))

(define-read-only (get-tip (tip-id uint))
    (map-get? FinancialTips tip-id))

(define-read-only (get-leaderboard-score (user principal))
    (ok (default-to u0 (map-get? LeaderboardScores user))))