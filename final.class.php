<?php 
date_default_timezone_set('America/New_York');
class final_rest
{



/**
 * @api  /api/v1/setTemp/
 * @apiName setTemp
 * @apiDescription Add remote temperature measurement
 *
 * @apiParam {string} location
 * @apiParam {String} sensor
 * @apiParam {double} value
 *
 * @apiSuccess {Integer} status
 * @apiSuccess {string} message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":0,
 *              "message": ""
 *     }
 *
 * @apiError Invalid data types
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *              "status":1,
 *              "message":"Error Message"
 *     }
 *
 */
	public static function setTemp ($location, $sensor, $value)

	{
		if (!is_numeric($value)) {
			$retData["status"]=1;
			$retData["message"]="'$value' is not numeric";
		}
		else {
			try {
				EXEC_SQL("insert into temperature (location, sensor, value, date) values (?,?,?,CURRENT_TIMESTAMP)",$location, $sensor, $value);
				$retData["status"]=0;
				$retData["message"]="insert of '$value' for location: '$location' and sensor '$sensor' accepted";
			}
			catch  (Exception $e) {
				$retData["status"]=1;
				$retData["message"]=$e->getMessage();
			}
		}

		return json_encode ($retData);
	}

	public static function signUp ($name, $username, $password) {

        try {

                $EXIST = GET_SQL("select * from user where username=?", $username);
                if (count($EXIST) > 0) {
                        $retData["status"] = 1;
                        $retData["message"] = "User $username exists";
                } else {
                        EXEC_SQL("insert into user (name,username,password) values (?,?,?)", $name, $username, password_hash($password, PASSWORD_DEFAULT));
                        $retData["status"] = 0;
                        $retData["message"] = "User $username Inserted";
                }

        } catch (Exception $e) {

                 $retData["status"]=1;
                 $retData["message"]=$e->getMessage();

        }

        return json_encode ($retData);

        }

	public static function login ($username, $password) {

        try {

		$USER = GET_SQL("select * from user where username=?", $username);
		// GET_SQL returns a list of returned records
		// Each array element is an array of selected fields with column names as key
		if (count($USER) == 1) { // Check if record returned
    			if (password_verify($password, $USER[0]["password"])) {
        			$id = session_create_id();
        			EXEC_SQL("update user set session=?, expiration= DATETIME(CURRENT_TIMESTAMP, '+30 minutes') where username=?",
            				$id, $username);
        			$retData["status"] = 0;
        			$retData["session"] = $id;
					$retData["username"] = $username;
        			$retData["message"] = "User '$username' logged in";
    			} else {
        			$retData["status"] = 1;
        			$retData["message"] = "User/Password Not Found";
    			}
		} else {
    			$retData["status"] = 1;
    			$retData["message"] = "User/Password Not Found";
		}

		return json_encode ($retData);

        } catch (Exception $e) {

                 $retData["status"]=1;
                 $retData["message"]=$e->getMessage();

        }

        return json_encode ($retData);

        }

	public static function logout ($username, $session) {

        try {

		$USER = GET_SQL("select * from user where username=? and session=? ", $username, $session);
		// GET_SQL returns a list of returned records
		// Each array element is an array of selected fields with column names as key
		if (count($USER) == 1) { // Check if record returned
    			EXEC_SQL("update user set session=null, expiration= null where username=?", $username);
    			$retData["status"] = 0;
    			$retData["message"] = "User '$username' logged out";
		} else {
    			$retData["status"] = 1;
    			$retData["message"] = "User Not Found";
		}

		return json_encode ($retData);

        } catch (Exception $e) {

                 $retData["status"]=1;
                 $retData["message"]=$e->getMessage();

        }

        return json_encode ($retData);

        }

	public static function addFavorite($username, $ticker, $name) {
		try {
			$favorites = GET_SQL("SELECT * FROM favorites WHERE username = ? AND ticker = ?;", $username, $ticker);

			if (count($favorites) == 0) {
				EXEC_SQL("INSERT INTO favorites VALUES (?,?,?,?,?);", $username, $ticker, $name, date("m-d-Y"), date("H:i:s"));
				$retData["status"] = 0;
				$retData["message"] = "$name was added to $username's favorites list";
			} else {
				$retData["status"] = 1;
				$retData["message"] = "$name is already in $username's favorites list";
			}
 
		} catch (Exception $e) {
			$retData["status"] = 1;
			$retData["message"] = $e->getMessage();
		}

		return json_encode($retData);
	}

	public static function removeFavorite($username, $ticker) {
		try {
			$stocks = GET_SQL("SELECT * FROM favorites WHERE username = ? AND ticker = ?;", $username, $ticker);

			if (count($stocks) > 0) {
				EXEC_SQL("DELETE FROM favorites WHERE  username = ? AND ticker = ?;",$username, $ticker);
				$retData["status"] = 0;
				$retData["message"] = "$ticker has been removed from $username's favorites list";
			} else {
				$retData["status"] = 1;
				$retData["message"] = "Cannot remove from $username's favorites list. $ticker is not in the list.";
			}
		} catch (Exception $e) {
			$retData["status"] = 1;
			$retData["message"] = $e->getMessage();
		}

		return json_encode($retData);
	}

	public static function getFavorites($username) {
		try {
			$favorites = GET_SQL("SELECT * FROM favorites WHERE username = ?;", $username);

			if (count($favorites) > 0) {
				$retData["status"] = 0;
				$retData["message"] = "Done.";
				$retData["data"] = $favorites;
			} else {
				$retData["status"] = 1;
				$retData["message"] = "No favorite stocks.";
			}
		} catch (Exception $e) {
			$retData["status"] = 1;
			$retData["message"] = $e->getMessage();
		}

		return json_encode($retData);
	}

	public static function log($username, $action, $ticker, $name) {
		try {
			EXEC_SQL("INSERT INTO log VALUES (?,?,?,?,?,?);", $username, $action, $ticker, $name, date("m-d-Y"), date("H:i:s"));
			$retData["status"] = 0;
			$retData["message"] = "Logged $action for $username";
		} catch (Exception $e) {
			$retData["status"] = 1;
			$retData["message"] = $e->getMessage();
		}
		return json_encode($retData);
	}

	public static function getLogDates($username) {
		try {
			$dates = GET_SQL("SELECT DISTINCT date FROM log WHERE username = ?;", $username);
			$retData["status"] = 0;
			$retData["message"] = "Retrieved all dates";
			$retData["dates"] = $dates;
		} catch (Exception $e) {
			$retData["status"] = 1;
			$retData["message"] = $e->getMessage();
		}
		return json_encode($retData);
	}

	public static function getLog($username, $date) {
		try {
			$log = GET_SQL("SELECT * FROM log WHERE username = ? AND date = ?;", $username, $date);
			$retData["status"] = 0;
			$retData["message"] = "Retrieved log for $username on $date";
			$retData["data"] = $log;
		} catch (Exception $e) {
			$retData["status"] = 1;
			$retData["message"] = $e->getMessage();
		}
		return json_encode($retData);
	}

	public static function getFavoritesOnDate($username, $date) {
		try {
			$favoritesToDate = GET_SQL("SELECT * FROM favorites WHERE username = ? AND date <= ?;", $username, $date);

			if (count($favoritesToDate) > 0) {
				$retData["status"] = 0;
				$retData["message"] = "Done.";
				$retData["data"] = $favoritesToDate;
			} else {
				$retData["status"] = 1;
				$retData["message"] = "No favorite stocks.";
			}
		} catch (Exception $e) {
			$retData["status"] = 1;
			$retData["message"] = $e->getMessage();
		}
		return json_encode($retData);
	}
		
}

