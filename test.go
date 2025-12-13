// scripts/loadtester.go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Print(os.Getenv("MYENV"), '!')

}
