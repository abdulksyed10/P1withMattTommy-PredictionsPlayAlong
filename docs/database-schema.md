#Database Schema — P1 Predictions

#Core Entities

##Season
| column     | type      |
| ---------- | --------- |
| id         | uuid      |
| year       | integer   |
| name       | text      |
| is_active  | boolean   |
| created_at | timestamp |
| updated_at | timestamp |

##races
| column     | type      |
| ---------- | --------- |
| id         | uuid      |
| season_id  | uuid      |
| round      | integer   |
| name       | text      |
| race_date  | date      |
| created_at | timestamp |
| updated_at | timestamp |

Foreign key
season_id → seasons.id

##race_sessions
| column     | type      |
| ---------- | --------- |
| id         | uuid      |
| race_id    | uuid      |
| session    | enum      |
| starts_at  | timestamp |
| created_at | timestamp |
| updated_at | timestamp |

Foreign key
race_id → races.id

#Teams and Drivers

##teams
| column     | type      |
| ---------- | --------- |
| id         | uuid      |
| code       | text      |
| name       | text      |
| is_active  | boolean   |
| created_at | timestamp |
| updated_at | timestamp |

drivers
| column     | type      |
| ---------- | --------- |
| id         | uuid      |
| code       | text      |
| full_name  | text      |
| is_active  | boolean   |
| created_at | timestamp |
| updated_at | timestamp |

#Questions System

##questions
| column                 | type      |
| ---------------------- | --------- |
| id                     | uuid      |
| season_id              | uuid      |
| key                    | text      |
| prompt                 | text      |
| answer_kind            | enum      |
| allow_multiple_correct | boolean   |
| is_active              | boolean   |
| created_at             | timestamp |
| updated_at             | timestamp |

Foreign key
season_id → seasons.id

##question_scoring
Defines how many points each question is worth.
| column        | type      |
| ------------- | --------- |
| id            | uuid      |
| season_id     | uuid      |
| question_id   | uuid      |
| points_driver | integer   |
| points_team   | integer   |
| created_at    | timestamp |
| updated_at    | timestamp |

Foreign keys
season_id → seasons.id
question_id → questions.id

#Race Results (Answer Keys)

##race_question_answer_keys
Stores the official answer set for a race.
| column       | type      |
| ------------ | --------- |
| id           | uuid      |
| race_id      | uuid      |
| question_id  | uuid      |
| is_final     | boolean   |
| published_at | timestamp |
| created_at   | timestamp |
| updated_at   | timestamp |

Foreign keys
race_id → races.id
question_id → questions.id

##race_question_correct_choices
Stores the actual correct driver/team answers.
| column        | type      |
| ------------- | --------- |
| id            | uuid      |
| answer_key_id | uuid      |
| choice_kind   | enum      |
| driver_id     | uuid      |
| team_id       | uuid      |
| created_at    | timestamp |

Foreign keys
answer_key_id → race_question_answer_keys.id
driver_id → drivers.id
team_id → teams.id

#User Profiles

##profiles
| column       | type      |
| ------------ | --------- |
| id           | uuid      |
| display_name | text      |
| created_at   | timestamp |
| updated_at   | timestamp |

#Race Predictions

##prediction_sets
One submission per user per race.
| column       | type      |
| ------------ | --------- |
| id           | uuid      |
| user_id      | uuid      |
| race_id      | uuid      |
| status       | enum      |
| submitted_at | timestamp |
| created_at   | timestamp |
| updated_at   | timestamp |

Foreign keys
user_id → profiles.id
race_id → races.id

##predictions
Each answer inside a prediction set.
| column            | type      |
| ----------------- | --------- |
| id                | uuid      |
| prediction_set_id | uuid      |
| question_id       | uuid      |
| answer_driver_id  | uuid      |
| answer_team_id    | uuid      |
| answer_int        | integer   |
| answer_text       | text      |
| created_at        | timestamp |

Foreign keys
prediction_set_id → prediction_sets.id
question_id → questions.id
answer_driver_id → drivers.id
answer_team_id → teams.id

#Season Predictions

##season_prediction_sets
| column       | type      |
| ------------ | --------- |
| id           | uuid      |
| user_id      | uuid      |
| season_id    | uuid      |
| status       | enum      |
| submitted_at | timestamp |
| created_at   | timestamp |
| updated_at   | timestamp |

Foreign keys
user_id → profiles.id
season_id → seasons.id

##season_predictions
| column                   | type      |
| ------------------------ | --------- |
| id                       | uuid      |
| season_prediction_set_id | uuid      |
| question_id              | uuid      |
| answer_driver_id         | uuid      |
| answer_team_id           | uuid      |
| answer_int               | integer   |
| answer_text              | text      |
| created_at               | timestamp |

Foreign keys
season_prediction_set_id → season_prediction_sets.id
question_id → questions.id
answer_driver_id → drivers.id
answer_team_id → teams.id

#Scoring Tables

##user_race_scores
| column       | type      |
| ------------ | --------- |
| id           | uuid      |
| user_id      | uuid      |
| race_id      | uuid      |
| total_points | integer   |
| breakdown    | jsonb     |
| computed_at  | timestamp |

Foreign keys
user_id → profiles.id
race_id → races.id

#user_season_scores
| column       | type      |
| ------------ | --------- |
| id           | uuid      |
| user_id      | uuid      |
| season_id    | uuid      |
| total_points | integer   |
| computed_at  | timestamp |

Foreign keys
user_id → profiles.id
season_id → seasons.id

#Leaderboards

##leaderboard_race
| column       | type      |
| ------------ | --------- |
| race_id      | uuid      |
| user_id      | uuid      |
| display_name | text      |
| total_points | integer   |
| computed_at  | timestamp |

##leaderboard_season
| column       | type      |
| ------------ | --------- |
| season_id    | uuid      |
| user_id      | uuid      |
| display_name | text      |
| total_points | integer   |
| computed_at  | timestamp |

